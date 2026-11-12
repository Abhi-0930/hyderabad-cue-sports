const db = require("../db");
const {
  SESSION_MAX_AGE_SECONDS,
  normalizePhone,
  normalizeEmail,
  hashBlindIndex,
  hashToken,
  encryptPII,
  decryptPII,
  maskPhone,
  maskEmail,
  signSessionJwt,
  verifySessionJwt,
} = require("../utils/crypto");
const { verifyTurnstileToken } = require("../utils/turnstile");
const { SESSION_COOKIE_NAME, resolveCustomerSession } = require("../utils/auth-middleware");

function getCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/**
 * Create a 30-day persistent session in PostgreSQL (hashed token) and attach cookie.
 */
async function createAndAttachSession(customer, request, reply) {
  const jwtToken = signSessionJwt({ customerId: customer.id });
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
      request.headers["user-agent"] || null,
      request.ip || null,
    ]
  );

  reply.setCookie(SESSION_COOKIE_NAME, jwtToken, getCookieOptions());
}

/**
 * Fastify plugin for Passwordless Customer Authentication routes.
 * @param {import('fastify').FastifyInstance} fastify
 */
async function authRoutes(fastify) {
  // POST /api/auth/continue - Verify Turnstile + lookup hashed phone
  fastify.post("/continue", async (request, reply) => {
    try {
      const { phone: rawPhone, turnstileToken } = request.body || {};

      const turnstileResult = await verifyTurnstileToken(turnstileToken, request.ip);
      if (!turnstileResult.success) {
        reply.status(403);
        return {
          success: false,
          message: "Human verification failed. Please complete the security check and try again.",
          errors: turnstileResult.errorCodes,
        };
      }

      const phone = normalizePhone(rawPhone);
      if (!phone) {
        reply.status(400);
        return {
          success: false,
          message: "Please enter a valid 10-digit Indian mobile number.",
        };
      }

      const phoneHash = hashBlindIndex(phone);
      const { rows } = await db.query(
        "SELECT id, phone_encrypted, email_encrypted, full_name, is_phone_verified FROM public.customers WHERE phone_hash = $1 LIMIT 1",
        [phoneHash]
      );

      if (rows.length > 0) {
        const customer = rows[0];
        await createAndAttachSession(customer, request, reply);

        const decryptedPhone = decryptPII(customer.phone_encrypted);
        const decryptedEmail = customer.email_encrypted
          ? decryptPII(customer.email_encrypted)
          : null;

        return {
          success: true,
          status: "logged_in",
          user: {
            id: customer.id,
            maskedPhone: maskPhone(decryptedPhone),
            maskedEmail: decryptedEmail ? maskEmail(decryptedEmail) : null,
            fullName: customer.full_name,
            isPhoneVerified: customer.is_phone_verified,
          },
        };
      }

      // New user: issue short-lived onboarding token to collect unique email next
      const onboardingToken = signSessionJwt(
        { purpose: "complete_signup", phone },
        "15m"
      );

      return {
        success: true,
        status: "needs_email",
        onboardingToken,
        maskedPhone: maskPhone(phone),
      };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return {
        success: false,
        message: "Authentication error occurred.",
        error: err.message,
      };
    }
  });

  // POST /api/auth/complete-signup - Capture unique email (hashed + encrypted) & issue 30-day session
  fastify.post("/complete-signup", async (request, reply) => {
    try {
      const { email: rawEmail, onboardingToken } = request.body || {};

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
          message: "Signup session expired. Please re-enter your mobile number.",
        };
      }

      if (decoded.purpose !== "complete_signup" || !decoded.phone) {
        reply.status(400);
        return { success: false, message: "Invalid signup session token." };
      }

      const email = normalizeEmail(rawEmail);
      if (!email) {
        reply.status(400);
        return { success: false, message: "Please enter a valid email address." };
      }

      const phone = decoded.phone;
      const phoneHash = hashBlindIndex(phone);
      const emailHash = hashBlindIndex(email);

      // Enforce unique email per account
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

      // Guard against duplicate race condition on phone_hash
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

      const phoneEncrypted = encryptPII(phone);
      const emailEncrypted = encryptPII(email);

      const { rows } = await db.query(
        `
        INSERT INTO public.customers (phone_hash, phone_encrypted, email_hash, email_encrypted, is_phone_verified)
        VALUES ($1, $2, $3, $4, false)
        RETURNING id, full_name, is_phone_verified
        `,
        [phoneHash, phoneEncrypted, emailHash, emailEncrypted]
      );

      const newCustomer = rows[0];
      await createAndAttachSession(newCustomer, request, reply);

      reply.status(201);
      return {
        success: true,
        status: "logged_in",
        user: {
          id: newCustomer.id,
          maskedPhone: maskPhone(phone),
          maskedEmail: maskEmail(email),
          fullName: newCustomer.full_name,
          isPhoneVerified: newCustomer.is_phone_verified,
        },
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

  // POST /api/auth/logout - Revoke hashed session in DB & clear cookie
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
}

module.exports = authRoutes;

