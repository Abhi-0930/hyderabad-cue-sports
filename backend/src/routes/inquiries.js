const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /api/inquiries - Submit consultation / custom snooker table inquiry
router.post("/", async (req, res) => {
  try {
    const { fullName, phone, email, city, productId, productInterest, roomDimensions, message } = req.body;

    if (!fullName || !phone || !city) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (fullName, phone, city)",
      });
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

    res.status(201).json({
      success: true,
      message: "Consultation inquiry submitted successfully. Our room-planning specialist will contact you shortly.",
      inquiry: rows[0],
    });
  } catch (err) {
    console.error("Error submitting inquiry:", err);
    res.status(500).json({ success: false, message: "Inquiry submission failed", error: err.message });
  }
});

module.exports = router;
