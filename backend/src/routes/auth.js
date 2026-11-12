const crypto = require("crypto");
const db = require("../db");
const {
  SESSION_MAX_AGE_SECONDS,
  normalizePhone,
  normalizeEmail,
  hashBlindIndex,
  hashToken,
  computeUserAgentHash,
  encryptPII,
  decryptPII,
  maskPhone,
  maskEmail,
  signSessionJwt,
  verifySessionJwt,
} = require("../utils/crypto");
const { verifyTurnstileToken } = require("../utils/turnstile");
const { SESSION_COOKIE_NAME, resolveCustomerSession } = require("../utils/auth-middleware");

// In-memory sliding-window tracker for identifier-level brute force protection
const identifierTracker = new Map();
function checkIdentifierRateLimit(hash) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxAttempts = 6;
  const record = identifierTracker.get(hash);
  if (!record || now > record.resetAt) {
    identifierTracker.set(hash, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxAttempts) {
    return false;
  }
  record.count += 1;
  return true;
}

// In-memory tracker for single-use onboarding JWT nonces (JTI)
const consumedOnboardingJtis = new Map();
function markAndVerifyJti(jti) {
  if (!jti) return true;
  const now = Date.now();
  for (const [key, exp] of consumedOnboardingJtis.entries()) {
    if (now > exp) consumedOnboardingJtis.delete(key);
  }
  if (consumedOnboardingJtis.has(jti)) {
    return false;
  }
  consumedOnboardingJtis.set(jti, now + 15 * 60 * 1000);
  return true;
}

// Side-channel timing attack neutralizer
async function constantTimeDelay(startTimeMs, targetMinMs = 240) {
  const elapsed = Date.now() - startTimeMs;
  if (elapsed < targetMinMs) {
    await new Promise((resolve) => setTimeout(resolve, targetMinMs - elapsed));
  }
}

function getCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

function buildPublicUser(customer, plainPhone, plainEmail) {
  return {
    id: customer.id,
    maskedPhone: maskPhone(plainPhone),
    maskedEmail: plainEmail ? maskEmail(plainEmail) : null,
    fullName: customer.full_name || null,
    isPhoneVerified: Boolean(customer.is_phone_verified),
  };
}

/**
 * Create a 30-day persistent session in PostgreSQL (hashed token + device fingerprint) and attach httpOnly cookie.
 */
async function createAndAttachSession(customer, request, reply) {
  const uaHash = computeUserAgentHash(request.headers?.["user-agent"]);
  const jwtToken = signSessionJwt({ customerId: customer.id, uaHash });
  const tokenHash = hashToken(jwtToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.query(
    `
    INSERT INTO public.auth_sessions (customer_id, token_hash, expires_at, user_agent, ip_address)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      customer.id,
      tokenHash,
      expiresAt.toISOString(),
      request.headers?.["user-agent"] || null,
      request.ip || null,
    ]
  );

  reply.setCookie(SESSION_COOKIE_NAME, jwtToken, getCookieOptions());
}

/**
 * Fastify plugin for Passwordless Customer Authentication routes.
 * Supports entry via Mobile Number (default) or Email-ID ("Use Email-ID").
 * @param {import('fastify').FastifyInstance} fastify
 */
async function authRoutes(fastify) {
  const authRateLimitConfig = {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
        errorResponseBuilder: (request, context) => ({
          success: false,
          statusCode: 429,
          message: `Too many authentication attempts. Please wait ${Math.ceil(context.ttl / 1000)} seconds before trying again.`,
        }),
      },
    },
  };

  // POST /api/auth/continue - Verify Turnstile + rate limits + lookup hashed phone or email
  fastify.post("/continue", authRateLimitConfig, async (request, reply) => {
    const startTime = Date.now();
    try {
      const { mode = "phone", phone: rawPhone, email: rawEmail, turnstileToken } =
        request.body || {};

      const turnstileResult = await verifyTurnstileToken(turnstileToken, request.ip);
      if (!turnstileResult.success) {
        reply.status(403);
        await constantTimeDelay(startTime);
        return {
          success: false,
          message: "Human verification failed. Please complete the security check and try again.",
          errors: turnstileResult.errorCodes,
        };
      }

      const clientIp = request.ip || "unknown";
      const uaHash = computeUserAgentHash(request.headers?.["user-agent"]);

      if (mode === "email") {
        const email = normalizeEmail(rawEmail);
        if (!email) {
          reply.status(400);
          await constantTimeDelay(startTime);
          return { success: false, message: "Please enter a valid email address." };
        }

        const emailHash = hashBlindIndex(email);
        if (!checkIdentifierRateLimit(emailHash)) {
          reply.status(429);
          await constantTimeDelay(startTime);
          return {
            success: false,
            message: "Too many authentication attempts for this account. Please wait 10 minutes before trying again.",
          };
        }

        const { rows } = await db.query(
          "SELECT id, phone_encrypted, email_encrypted, full_name, is_phone_verified FROM public.customers WHERE email_hash = $1 LIMIT 1",
          [emailHash]
        );

        if (rows.length > 0) {
          const customer = rows[0];
          await createAndAttachSession(customer, request, reply);
          const decryptedPhone = decryptPII(customer.phone_encrypted);
          await constantTimeDelay(startTime);
          return {
            success: true,
            status: "logged_in",
            user: buildPublicUser(customer, decryptedPhone, email),
          };
        }

        const jti = crypto.randomUUID();
        const onboardingToken = signSessionJwt(
          { purpose: "complete_signup_phone", email, clientIp, uaHash, jti },
          "10m"
        );

        await constantTimeDelay(startTime);
        return {
          success: true,
          status: "needs_phone",
          onboardingToken,
          maskedEmail: maskEmail(email),
        };
      }

      // Default mode: phone
      const phone = normalizePhone(rawPhone);
      if (!phone) {
        reply.status(400);
        await constantTimeDelay(startTime);
        return {
          success: false,
          message: "Please enter a valid 10-digit Indian mobile number.",
        };
      }

      const phoneHash = hashBlindIndex(phone);
      if (!checkIdentifierRateLimit(phoneHash)) {
        reply.status(429);
        await constantTimeDelay(startTime);
        return {
          success: false,
          message: "Too many authentication attempts for this mobile number. Please wait 10 minutes before trying again.",
        };
      }

      const { rows } = await db.query(
        "SELECT id, phone_encrypted, email_encrypted, full_name, is_phone_verified FROM public.customers WHERE phone_hash = $1 LIMIT 1",
        [phoneHash]
      );

      if (rows.length > 0) {
        const customer = rows[0];
        await createAndAttachSession(customer, request, reply);
        const decryptedEmail = customer.email_encrypted
          ? decryptPII(customer.email_encrypted)
          : null;

        await constantTimeDelay(startTime);
        return {
          success: true,
          status: "logged_in",
          user: buildPublicUser(customer, phone, decryptedEmail),
        };
      }

      const jti = crypto.randomUUID();
      const onboardingToken = signSessionJwt(
        { purpose: "complete_signup_email", phone, clientIp, uaHash, jti },
        "10m"
      );

      await constantTimeDelay(startTime);
      return {
        success: true,
        status: "needs_email",
        onboardingToken,
        maskedPhone: maskPhone(phone),
      };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      await constantTimeDelay(startTime);
      return {
        success: false,
        message: "Authentication error occurred.",
        error: err.message,
      };
    }
  });

  // POST /api/auth/complete-signup - Rate-limited & device-verified Step 2 registration
  fastify.post("/complete-signup", authRateLimitConfig, async (request, reply) => {
    try {
      const { email: rawEmail, phone: rawPhone, onboardingToken } = request.body || {};

      if (!onboardingToken) {
        reply.status(400);
        return { success: false, message: "Missing signup session token." };
      }

      let decoded;
      try {
        decoded = verifySessionJwt(onboardingToken);
      } catch {
        reply.status(401);
        return {
          success: false,
          message: "Signup session expired. Please start again.",
        };
      }

      // Verify browser & device binding between Step 1 and Step 2
      const currentUaHash = computeUserAgentHash(request.headers?.["user-agent"]);
      if (decoded.uaHash && decoded.uaHash !== currentUaHash) {
        reply.status(403);
        return {
          success: false,
          message: "Security check failed: Registration must be completed on the same device and browser session.",
        };
      }

      // Verify and invalidate single-use nonce
      if (!markAndVerifyJti(decoded.jti)) {
        reply.status(401);
        return {
          success: false,
          message: "This signup session token has already been used. Please start again.",
        };
      }

      let phone;
      let email;

      if (decoded.purpose === "complete_signup_email" && decoded.phone) {
        phone = decoded.phone;
        email = normalizeEmail(rawEmail);
        if (!email) {
          reply.status(400);
          return { success: false, message: "Please enter a valid email address." };
        }
      } else if (decoded.purpose === "complete_signup_phone" && decoded.email) {
        email = decoded.email;
        phone = normalizePhone(rawPhone);
        if (!phone) {
          reply.status(400);
          return {
            success: false,
            message: "Please enter a valid 10-digit Indian mobile number.",
          };
        }
      } else {
        reply.status(400);
        return { success: false, message: "Invalid signup session token." };
      }

      const phoneHash = hashBlindIndex(phone);
      const emailHash = hashBlindIndex(email);

      const emailCheck = await db.query(
        "SELECT id FROM public.customers WHERE email_hash = $1 LIMIT 1",
        [emailHash]
      );
      if (emailCheck.rows.length > 0) {
        reply.status(409);
        return {
          success: false,
          message: "This email address is already registered with another mobile number.",
        };
      }

      const phoneCheck = await db.query(
        "SELECT id FROM public.customers WHERE phone_hash = $1 LIMIT 1",
        [phoneHash]
      );
      if (phoneCheck.rows.length > 0) {
        reply.status(409);
        return {
          success: false,
          message: "An account with this mobile number already exists.",
        };
      }

      const { rows } = await db.query(
        `
        INSERT INTO public.customers (phone_hash, phone_encrypted, email_hash, email_encrypted, is_phone_verified)
        VALUES ($1, $2, $3, $4, false)
        RETURNING id, full_name, is_phone_verified
        `,
        [phoneHash, encryptPII(phone), emailHash, encryptPII(email)]
      );

      const newCustomer = rows[0];
      await createAndAttachSession(newCustomer, request, reply);

      reply.status(201);
      return {
        success: true,
        status: "logged_in",
        user: buildPublicUser(newCustomer, phone, email),
      };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return {
        success: false,
        message: "Failed to complete registration.",
        error: err.message,
      };
    }
  });

  // GET /api/auth/me - Current authenticated user info
  fastify.get("/me", async (request) => {
    const customer = await resolveCustomerSession(request);
    if (!customer) {
      return { authenticated: false, user: null };
    }
    return {
      authenticated: true,
      user: {
        id: customer.id,
        maskedPhone: customer.maskedPhone,
        maskedEmail: customer.maskedEmail,
        fullName: customer.fullName,
        isPhoneVerified: customer.isPhoneVerified,
      },
    };
  });

  // POST /api/auth/logout - Revoke current hashed session in DB & clear cookie
  fastify.post("/logout", async (request, reply) => {
    const customer = await resolveCustomerSession(request);
    if (customer?.tokenHash) {
      await db.query("DELETE FROM public.auth_sessions WHERE token_hash = $1", [
        customer.tokenHash,
      ]);
    }
    reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    return { success: true, message: "Logged out successfully." };
  });

  // POST /api/auth/logout-all - Invalidate ALL active sessions across all devices for this customer
  fastify.post("/logout-all", async (request, reply) => {
    const customer = await resolveCustomerSession(request);
    if (!customer) {
      reply.status(401);
      return { success: false, message: "Authentication required." };
    }
    const res = await db.query("DELETE FROM public.auth_sessions WHERE customer_id = $1", [
      customer.id,
    ]);
    reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    return {
      success: true,
      message: `Signed out from all devices (${res.rowCount || 1} session(s) terminated).`,
    };
  });
}

module.exports = authRoutes;
