const db = require("../db");
const { requireAuth } = require("../utils/auth-middleware");
const { encryptPII, decryptPII, normalizePhone } = require("../utils/crypto");

/**
 * Fastify plugin for Authenticated Customer Portal routes
 * @param {import('fastify').FastifyInstance} fastify
 */
async function customerRoutes(fastify) {
  // Apply session authentication guard to all routes in this plugin
  fastify.addHook("preHandler", requireAuth);

  // PATCH /api/customer/profile - Update customer full name
  fastify.patch("/profile", async (request, reply) => {
    const { fullName } = request.body || {};
    const trimmed = String(fullName || "").trim();
    if (!trimmed || trimmed.length < 2) {
      reply.status(400);
      return { success: false, message: "Please provide a valid full name." };
    }

    const { rows } = await db.query(
      `
      UPDATE public.customers
      SET full_name = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, full_name
      `,
      [trimmed, request.customer.id]
    );

    return { success: true, fullName: rows[0].full_name };
  });

  // GET /api/customer/orders - List logged-in customer's orders with line items
  fastify.get("/orders", async (request) => {
    const ordersRes = await db.query(
      `
      SELECT id, order_number, shipping_address, subtotal, tax, shipping_charge,
             total_amount, payment_method, payment_status, order_status, created_at
      FROM public.orders
      WHERE customer_id = $1
      ORDER BY created_at DESC
      `,
      [request.customer.id]
    );

    const orders = ordersRes.rows;
    if (orders.length === 0) {
      return { success: true, data: [] };
    }

    const orderIds = orders.map((o) => o.id);
    const itemsRes = await db.query(
      `
      SELECT id, order_id, product_id, product_name, product_image, unit_price, quantity, total_price
      FROM public.order_items
      WHERE order_id = ANY($1::uuid[])
      `,
      [orderIds]
    );

    const itemsByOrder = new Map();
    for (const item of itemsRes.rows) {
      if (!itemsByOrder.has(item.order_id)) {
        itemsByOrder.set(item.order_id, []);
      }
      itemsByOrder.get(item.order_id).push(item);
    }

    const enriched = orders.map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) || [],
    }));

    return { success: true, data: enriched };
  });

  // GET /api/customer/addresses - List saved addresses
  fastify.get("/addresses", async (request) => {
    const { rows } = await db.query(
      `
      SELECT id, label, recipient_name, phone_encrypted, address_line1, address_line2,
             city, state, pincode, is_default, created_at
      FROM public.customer_addresses
      WHERE customer_id = $1
      ORDER BY is_default DESC, created_at DESC
      `,
      [request.customer.id]
    );

    const addresses = rows.map((row) => ({
      id: row.id,
      label: row.label,
      recipientName: row.recipient_name,
      phone: decryptPII(row.phone_encrypted),
      addressLine1: row.address_line1,
      addressLine2: row.address_line2,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      isDefault: row.is_default,
      createdAt: row.created_at,
    }));

    return { success: true, data: addresses };
  });

  // POST /api/customer/addresses - Save a new delivery address
  fastify.post("/addresses", async (request, reply) => {
    const {
      label = "Home",
      recipientName,
      phone: rawPhone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault = false,
    } = request.body || {};

    const phone = normalizePhone(rawPhone || request.customer.phone);
    if (!recipientName || !phone || !addressLine1 || !city || !state || !pincode) {
      reply.status(400);
      return {
        success: false,
        message: "Missing required address fields (recipientName, phone, addressLine1, city, state, pincode).",
      };
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      if (isDefault) {
        await client.query(
          "UPDATE public.customer_addresses SET is_default = false WHERE customer_id = $1",
          [request.customer.id]
        );
      }

      const { rows } = await client.query(
        `
        INSERT INTO public.customer_addresses (
          customer_id, label, recipient_name, phone_encrypted,
          address_line1, address_line2, city, state, pincode, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, label, recipient_name, address_line1, address_line2, city, state, pincode, is_default, created_at
        `,
        [
          request.customer.id,
          label,
          recipientName.trim(),
          encryptPII(phone),
          addressLine1.trim(),
          addressLine2 ? addressLine2.trim() : null,
          city.trim(),
          state.trim(),
          String(pincode).trim(),
          Boolean(isDefault),
        ]
      );

      await client.query("COMMIT");

      const row = rows[0];
      reply.status(201);
      return {
        success: true,
        address: {
          id: row.id,
          label: row.label,
          recipientName: row.recipient_name,
          phone,
          addressLine1: row.address_line1,
          addressLine2: row.address_line2,
          city: row.city,
          state: row.state,
          pincode: row.pincode,
          isDefault: row.is_default,
          createdAt: row.created_at,
        },
      };
    } catch (err) {
      await client.query("ROLLBACK");
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Failed to save address.", error: err.message };
    } finally {
      client.release();
    }
  });

  // DELETE /api/customer/addresses/:id - Remove a saved address
  fastify.delete("/addresses/:id", async (request, reply) => {
    const { id } = request.params;
    const result = await db.query(
      "DELETE FROM public.customer_addresses WHERE id = $1 AND customer_id = $2 RETURNING id",
      [id, request.customer.id]
    );
    if (result.rows.length === 0) {
      reply.status(404);
      return { success: false, message: "Address not found." };
    }
    return { success: true, message: "Address deleted." };
  });

  // GET /api/customer/wishlist - Get saved wishlist products
  fastify.get("/wishlist", async (request) => {
    const { rows } = await db.query(
      `
      SELECT p.*, w.created_at AS wishlisted_at
      FROM public.wishlist_items w
      JOIN public.products p ON p.id = w.product_id
      WHERE w.customer_id = $1
      ORDER BY w.created_at DESC
      `,
      [request.customer.id]
    );
    return { success: true, data: rows };
  });

  // POST /api/customer/wishlist/toggle - Add/remove product in wishlist
  fastify.post("/wishlist/toggle", async (request, reply) => {
    const { productId } = request.body || {};
    if (!productId) {
      reply.status(400);
      return { success: false, message: "productId is required." };
    }

    const existing = await db.query(
      "SELECT id FROM public.wishlist_items WHERE customer_id = $1 AND product_id = $2 LIMIT 1",
      [request.customer.id, productId]
    );

    if (existing.rows.length > 0) {
      await db.query("DELETE FROM public.wishlist_items WHERE id = $1", [existing.rows[0].id]);
      return { success: true, wishlisted: false };
    }

    await db.query(
      "INSERT INTO public.wishlist_items (customer_id, product_id) VALUES ($1, $2)",
      [request.customer.id, productId]
    );
    return { success: true, wishlisted: true };
  });
}

module.exports = customerRoutes;

