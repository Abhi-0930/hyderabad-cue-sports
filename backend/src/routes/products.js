const db = require("../db");

function formatStorefrontProduct(r) {
  let details = [];
  try {
    details = Array.isArray(r.details) ? r.details : JSON.parse(r.details || "[]");
  } catch {
    details = [];
  }

  let specs = [];
  try {
    if (Array.isArray(r.specs)) {
      specs = r.specs;
    } else if (r.specs && typeof r.specs === "object") {
      specs = Object.entries(r.specs).map(([label, value]) => ({ label, value: String(value) }));
    }
  } catch {
    specs = [];
  }

  let gallery = [];
  try {
    gallery = Array.isArray(r.gallery) ? r.gallery : JSON.parse(r.gallery || "[]");
  } catch {
    gallery = [r.image];
  }

  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    type: r.type || (r.category.toLowerCase().includes("table") ? "table" : "accessory"),
    size: r.size || "Standard",
    price: Number(r.price) || 0,
    compareAt: Number(r.compare_at) || undefined,
    image: r.image,
    gallery: gallery.length > 0 ? gallery : [r.image],
    badge: r.badge || (r.is_featured ? "Featured" : undefined),
    availability: r.availability || "In stock",
    description: r.description || "",
    details: details.length > 0 ? details : [r.description?.slice(0, 80)].filter(Boolean),
    specs,
    tags: Array.isArray(r.tags) ? r.tags : [],
  };
}

/**
 * Fastify plugin for Storefront Products routes
 * @param {import('fastify').FastifyInstance} fastify
 */
async function productsRoutes(fastify, options) {
  // GET /api/products - List all published products with optional filters
  fastify.get("/", async (request, reply) => {
    try {
      const { category, type, size, search, sort } = request.query;

      let query = "SELECT * FROM public.products WHERE (publication_status = 'Published' OR publication_status IS NULL)";
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
      const data = rows.map(formatStorefrontProduct);
      return { success: true, count: data.length, data };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Database query error", error: err.message };
    }
  });

  // GET /api/products/:slug - Single published product by slug
  fastify.get("/:slug", async (request, reply) => {
    try {
      const { slug } = request.params;
      const { rows } = await db.query(
        "SELECT * FROM public.products WHERE slug = $1 AND (publication_status = 'Published' OR publication_status IS NULL) LIMIT 1",
        [slug]
      );

      if (rows.length === 0) {
        reply.status(404);
        return { success: false, message: "Product not found" };
      }

      return { success: true, data: formatStorefrontProduct(rows[0]) };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Database query error", error: err.message };
    }
  });
}

module.exports = productsRoutes;
