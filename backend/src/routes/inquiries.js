const db = require("../db");

/**
 * Fastify plugin for Inquiries routes
 * @param {import('fastify').FastifyInstance} fastify
 */
async function inquiriesRoutes(fastify, options) {
  // POST /api/inquiries - Submit consultation / custom snooker table inquiry
  fastify.post("/", async (request, reply) => {
    try {
      const {
        fullName,
        phone,
        email,
        city,
        productId,
        productInterest,
        roomDimensions,
        message,
      } = request.body || {};

      if (!fullName || !phone || !city) {
        reply.status(400);
        return {
          success: false,
          message: "Missing required fields (fullName, phone, city)",
        };
      }

      const sql = `
        INSERT INTO public.inquiries (
          full_name, phone, email, city, product_id, product_interest, room_dimensions, message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;

      const { rows } = await db.query(sql, [
        fullName,
        phone,
        email || null,
        city,
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
