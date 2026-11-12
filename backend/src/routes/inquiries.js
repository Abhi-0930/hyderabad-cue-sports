const db = require("../db");
const { encryptPII, normalizePhone, normalizeEmail } = require("../utils/crypto");

/**
 * Fastify plugin for Inquiries routes (with AES-256 PII protection at rest)
 * @param {import('fastify').FastifyInstance} fastify
 */
async function inquiriesRoutes(fastify) {
  // POST /api/inquiries - Submit consultation / custom snooker table inquiry
  fastify.post("/", async (request, reply) => {
    try {
      const {
        fullName,
        phone: rawPhone,
        email: rawEmail,
        city,
        productId,
        productInterest,
        roomDimensions,
        message,
      } = request.body || {};

      const phone = normalizePhone(rawPhone);
      const email = rawEmail ? normalizeEmail(rawEmail) : null;

      if (!fullName || !phone || !city) {
        reply.status(400);
        return {
          success: false,
          message: "Missing or invalid required fields (fullName, valid 10-digit phone, city).",
        };
      }

      const sql = `
        INSERT INTO public.inquiries (
          full_name, phone, email, city, product_id, product_interest, room_dimensions, message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, city, product_interest, room_dimensions, status, created_at;
      `;

      const { rows } = await db.query(sql, [
        fullName.trim(),
        encryptPII(phone),
        email ? encryptPII(email) : null,
        city.trim(),
        productId || null,
        productInterest || null,
        roomDimensions || null,
        message || null,
      ]);

      reply.status(201);
      return {
        success: true,
        message:
          "Consultation inquiry submitted successfully. Our room-planning specialist will contact you shortly.",
        inquiry: rows[0],
      };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Inquiry submission failed", error: err.message };
    }
  });
}

module.exports = inquiriesRoutes;
