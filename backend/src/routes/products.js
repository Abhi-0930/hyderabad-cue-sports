const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/products - List all products with optional filters
router.get("/", async (req, res) => {
  try {
    const { category, type, size, search, sort } = req.query;
    
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
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, message: "Database query error", error: err.message });
  }
});

// GET /api/products/:slug - Single product by slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { rows } = await db.query("SELECT * FROM public.products WHERE slug = $1 LIMIT 1", [slug]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Error fetching product by slug:", err);
    res.status(500).json({ success: false, message: "Database query error", error: err.message });
  }
});

module.exports = router;
