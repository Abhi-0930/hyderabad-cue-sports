const db = require("../db");

/**
 * Fastify plugin for Products routes
 * @param {import('fastify').FastifyInstance} fastify
 */
async function productsRoutes(fastify, options) {
  // GET /api/products - List all products with optional filters
  fastify.get("/", async (request, reply) => {
    try {
      const { category, type, size, search, sort } = request.query;

      let query = "SELECT * FROM public.products WHERE 1=1";
      const params = [];
      let paramIndex = 1;

      if (category && category !== "all") {
        query += ` AND LOWER(category) = LOWER($${paramIndex++})`;
        params.push(category);
      }

      if (type && type !== "all") {
        query += ` AND LOWER(type) = LOWER($${paramIndex++})`;
        params.push(type);
      }

      if (size && size !== "all") {
        query += ` AND size = $${paramIndex++}`;
        params.push(size);
      }

      if (search) {
        query += ` AND (LOWER(name) LIKE $${paramIndex} OR LOWER(description) LIKE $${paramIndex})`;
        params.push(`%${search.toLowerCase()}%`);
        paramIndex++;
      }

      if (sort === "low") {
        query += " ORDER BY price ASC";
      } else if (sort === "high") {
        query += " ORDER BY price DESC";
      } else if (sort === "new") {
        query += " ORDER BY created_at DESC";
      } else {
        query += " ORDER BY is_featured DESC, created_at ASC";
      }

      const { rows } = await db.query(query, params);
      return { success: true, count: rows.length, data: rows };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Database query error", error: err.message };
    }
  });

  // GET /api/products/:slug - Single product by slug
  fastify.get("/:slug", async (request, reply) => {
    try {
      const { slug } = request.params;
      const { rows } = await db.query(
        "SELECT * FROM public.products WHERE slug = $1 LIMIT 1",
        [slug]
      );

      if (rows.length === 0) {
        reply.status(404);
        return { success: false, message: "Product not found" };
      }

      return { success: true, data: rows[0] };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Database query error", error: err.message };
    }
  });
}

module.exports = productsRoutes;
