const db = require("../db");

/**
 * Fastify plugin for Orders routes
 * @param {import('fastify').FastifyInstance} fastify
 */
async function ordersRoutes(fastify, options) {
  // POST /api/orders - Create a new order with items
  fastify.post("/", async (request, reply) => {
    const client = await db.pool.connect();
    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items,
        totalAmount,
        paymentMethod = "online",
        notes,
      } = request.body || {};

      if (!customerName || !customerEmail || !customerPhone || !items || !items.length) {
        reply.status(400);
        return {
          success: false,
          message: "Missing required order fields (customerName, customerEmail, customerPhone, items)",
        };
      }

      const orderNumber = `HCS-${Date.now().toString().slice(-6)}`;

      await client.query("BEGIN");

      // 1. Insert parent order
      const orderInsertSql = `
        INSERT INTO public.orders (
          order_number, customer_name, customer_email, customer_phone,
          shipping_address, subtotal, total_amount, payment_method, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;
      const orderResult = await client.query(orderInsertSql, [
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        JSON.stringify(shippingAddress || {}),
        totalAmount,
        totalAmount,
        paymentMethod,
        notes || null,
      ]);

      const createdOrder = orderResult.rows[0];

      // 2. Insert order items
      const itemInsertSql = `
        INSERT INTO public.order_items (
          order_id, product_id, product_name, product_image, unit_price, quantity, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;

      const insertedItems = [];
      for (const item of items) {
        const itemRes = await client.query(itemInsertSql, [
          createdOrder.id,
          item.productId || null,
          item.name,
          item.image || null,
          item.price,
          item.quantity,
          item.price * item.quantity,
        ]);
        insertedItems.push(itemRes.rows[0]);
      }

      await client.query("COMMIT");

      reply.status(201);
      return {
        success: true,
        message: "Order placed successfully",
        order: createdOrder,
        items: insertedItems,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Order creation failed", error: err.message };
    } finally {
      client.release();
    }
  });

  // GET /api/orders/:orderNumber - Fetch order by order number
  fastify.get("/:orderNumber", async (request, reply) => {
    try {
      const { orderNumber } = request.params;
      const orderRes = await db.query(
        "SELECT * FROM public.orders WHERE order_number = $1 LIMIT 1",
        [orderNumber]
      );

      if (orderRes.rows.length === 0) {
        reply.status(404);
        return { success: false, message: "Order not found" };
      }

      const order = orderRes.rows[0];
      const itemsRes = await db.query(
        "SELECT * FROM public.order_items WHERE order_id = $1",
        [order.id]
      );

      return {
        success: true,
        order: {
          ...order,
          items: itemsRes.rows,
        },
      };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Database query error", error: err.message };
    }
  });
}

module.exports = ordersRoutes;
