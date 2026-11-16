const crypto = require("crypto");
const db = require("../db");
const { signSessionJwt, verifySessionJwt, normalizeEmail } = require("../utils/crypto");

const ADMIN_COOKIE_NAME = "hcs_admin_session";

/**
 * Verify a candidate password against the stored scrypt hash string: scrypt:<saltHex>:<hashHex>
 */
function verifyPassword(candidatePassword, storedHash) {
  if (!candidatePassword || !storedHash || typeof storedHash !== "string") {
    return false;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const saltHex = parts[1];
  const expectedHashHex = parts[2];
  const expectedBuffer = Buffer.from(expectedHashHex, "hex");

  const derivedBuffer = crypto.scryptSync(candidatePassword, saltHex, 64);
  return (
    expectedBuffer.length === derivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, derivedBuffer)
  );
}

/**
 * Fastify plugin for Admin Authentication and Administration routes backed by PostgreSQL
 * @param {import('fastify').FastifyInstance} fastify
 */
async function adminRoutes(fastify) {
  // Rate limiter specifically for admin login attempts (5 attempts per minute per IP)
  const adminLoginRateLimit = {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
        errorResponseBuilder: (request, context) => ({
          success: false,
          statusCode: 429,
          message: `Too many failed admin login attempts. Please wait ${Math.ceil(context.ttl / 1000)} seconds before trying again.`,
        }),
      },
    },
  };

  // POST /api/admin/login - Authenticate admin against public.admin_users in PostgreSQL
  fastify.post("/login", adminLoginRateLimit, async (request, reply) => {
    try {
      const { email: rawEmail, password } = request.body || {};
      const email = normalizeEmail(rawEmail);

      if (!email || !password || typeof password !== "string") {
        reply.status(400);
        return {
          success: false,
          message: "Please enter your admin email and password.",
        };
      }

      // 1. Query the database for the active admin user
      const { rows } = await db.query(
        `
        SELECT id, email, password_hash, full_name, role, is_active
        FROM public.admin_users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [email]
      );

      if (rows.length === 0) {
        request.log.warn({ email, ip: request.ip }, "Admin login failed: Email not found.");
        reply.status(401);
        return {
          success: false,
          message: "Invalid admin email or password.",
        };
      }

      const adminUser = rows[0];

      if (!adminUser.is_active) {
        request.log.warn({ email, ip: request.ip }, "Admin login blocked: Account deactivated.");
        reply.status(403);
        return {
          success: false,
          message: "This admin account is deactivated. Please contact the administrator.",
        };
      }

      // 2. Constant-time salted scrypt password verification
      const isPasswordValid = verifyPassword(password, adminUser.password_hash);
      if (!isPasswordValid) {
        request.log.warn({ email, ip: request.ip }, "Admin login failed: Password mismatch.");
        reply.status(401);
        return {
          success: false,
          message: "Invalid admin email or password.",
        };
      }

      // 3. Update last_login_at timestamp in PostgreSQL
      await db.query(
        "UPDATE public.admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
        [adminUser.id]
      );

      // 4. Issue admin JWT session token
      const adminPayload = {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: adminUser.role,
        issuedAt: Date.now(),
      };
      const token = signSessionJwt(adminPayload, "7d");

      // 5. Attach secure httpOnly cookie
      const isProduction = process.env.NODE_ENV === "production";
      reply.setCookie(ADMIN_COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return {
        success: true,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          fullName: adminUser.full_name,
          role: adminUser.role,
          token,
        },
      };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return {
        success: false,
        message: "An internal database or authentication error occurred.",
      };
    }
  });

  // GET /api/admin/me - Verify current admin session against PostgreSQL
  fastify.get("/me", async (request, reply) => {
    try {
      const cookieToken = request.cookies?.[ADMIN_COOKIE_NAME];
      const authHeader = request.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;

      const token = cookieToken || bearerToken;
      if (!token) {
        reply.status(401);
        return { success: false, message: "Unauthenticated admin session." };
      }

      const decoded = verifySessionJwt(token);
      if (!decoded || !decoded.id || !["superadmin", "admin", "manager"].includes(decoded.role)) {
        reply.status(401);
        return { success: false, message: "Invalid or expired admin session token." };
      }

      // Verify that the user still exists and remains active in PostgreSQL
      const { rows } = await db.query(
        "SELECT id, email, full_name, role, is_active FROM public.admin_users WHERE id = $1 LIMIT 1",
        [decoded.id]
      );

      if (rows.length === 0 || !rows[0].is_active) {
        reply.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
        reply.status(401);
        return { success: false, message: "Admin account no longer active." };
      }

      const user = rows[0];
      return {
        success: true,
        admin: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      };
    } catch (err) {
      reply.status(401);
      return { success: false, message: "Session expired or invalid." };
    }
  });

  // POST /api/admin/logout - Clear admin session cookie
  fastify.post("/logout", async (request, reply) => {
    reply.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
    return { success: true, message: "Logged out successfully." };
  });
}

module.exports = adminRoutes;
