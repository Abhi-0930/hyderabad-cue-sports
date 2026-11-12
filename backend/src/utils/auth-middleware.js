const db = require("../db");
const {
  hashToken,
  verifySessionJwt,
  decryptPII,
  maskPhone,
  maskEmail,
} = require("./crypto");

const SESSION_COOKIE_NAME = "hcs_session";

/**
 * Resolves the authenticated customer from the hcs_session httpOnly cookie.
 * Returns null if unauthenticated or expired.
 */
async function resolveCustomerSession(request) {
  const token = request.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return null;

  try {
    const decoded = verifySessionJwt(token);
    const tokenHash = hashToken(token);

    const { rows } = await db.query(
      `
      SELECT c.id, c.phone_encrypted, c.email_encrypted, c.full_name, c.is_phone_verified, s.expires_at
      FROM public.auth_sessions s
      JOIN public.customers c ON c.id = s.customer_id
      WHERE s.token_hash = $1 AND s.customer_id = $2 AND s.expires_at > NOW()
      LIMIT 1
      `,
      [tokenHash, decoded.customerId]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    const phone = decryptPII(row.phone_encrypted);
    const email = row.email_encrypted ? decryptPII(row.email_encrypted) : null;

    return {
      id: row.id,
      phone,
      email,
      maskedPhone: maskPhone(phone),
      maskedEmail: email ? maskEmail(email) : null,
      fullName: row.full_name,
      isPhoneVerified: row.is_phone_verified,
      tokenHash,
    };
  } catch {
    return null;
  }
}

async function optionalAuth(request) {
  request.customer = await resolveCustomerSession(request);
}

async function requireAuth(request, reply) {
  const customer = await resolveCustomerSession(request);
  if (!customer) {
    reply.status(401).send({
      success: false,
      message: "Authentication required. Please sign in to continue.",
    });
    return reply;
  }
  request.customer = customer;
}

module.exports = {
  SESSION_COOKIE_NAME,
  resolveCustomerSession,
  optionalAuth,
  requireAuth,
};
