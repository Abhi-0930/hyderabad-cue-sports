const db = require("../db");
const { optionalAuth } = require("../utils/auth-middleware");
const { encryptPII } = require("../utils/crypto");

/**
 * Fastify plugin for Orders routes with server-side price verification & stock deduction
 * @param {import('fastify').FastifyInstance} fastify
 */
async function ordersRoutes(fastify) {
  // POST /api/orders - Create a new order with server-verified product pricing
  fastify.post("/", { preHandler: optionalAuth }, async (request, reply) => {
    const client = await db.pool.connect();
    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items,
        paymentMethod = "online",
        notes,
      } = request.body || {};

      const resolvedEmail = customerEmail || request.customer?.email;
      const resolvedPhone = customerPhone || request.customer?.phone;

      if (!customerName || !resolvedEmail || !resolvedPhone || !Array.isArray(items) || items.length === 0) {
        reply.status(400);
        return {
          success: false,
          message: "Missing required order fields (customerName, email, phone, items).",
        };
      }

      const productIds = items.map((item) => item.productId).filter(Boolean);
      if (productIds.length !== items.length) {
        reply.status(400);
        return { success: false, message: "Each order item must specify a valid productId." };
      }

      await client.query("BEGIN");

      // 1. Fetch authoritative prices & stock from PostgreSQL (prevents client-side price tampering)
      const productsRes = await client.query(
        "SELECT id, name, price, image, stock_quantity FROM public.products WHERE id = ANY($1::text[]) FOR UPDATE",
        [productIds]
      );

      const productMap = new Map(productsRes.rows.map((p) => [p.id, p]));

      let serverSubtotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        const qty = parseInt(item.quantity, 10);

        if (!product) {
          await client.query("ROLLBACK");
          reply.status(404);
          return { success: false, message: `Product not found: ${item.productId}` };
        }

        if (!Number.isInteger(qty) || qty <= 0) {
          await client.query("ROLLBACK");
          reply.status(400);
          return { success: false, message: `Invalid quantity for product: ${product.name}` };
        }

        if (product.stock_quantity < qty) {
          await client.query("ROLLBACK");
          reply.status(409);
          return {
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`,
          };
        }

        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * qty;
        serverSubtotal += lineTotal;

        verifiedItems.push({
          productId: product.id,
          name: product.name,
          image: product.image,
          unitPrice,
          quantity: qty,
          totalPrice: lineTotal,
        });
      }

      const orderNumber = `HCS-${Date.now().toString().slice(-6)}`;

      // 2. Insert parent order linked to customer_id if signed in (encrypting order contact PII)
      const orderResult = await client.query(
        `
        INSERT INTO public.orders (
          order_number, customer_id, customer_name, customer_email, customer_phone,
          shipping_address, subtotal, total_amount, payment_method, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, order_number, subtotal, tax, shipping_charge, total_amount,
                  payment_method, payment_status, order_status, created_at;
        `,
        [
          orderNumber,
          request.customer?.id || null,
          customerName.trim(),
          encryptPII(resolvedEmail),
          encryptPII(resolvedPhone),
          JSON.stringify(shippingAddress || {}),
          serverSubtotal,
          serverSubtotal,
          paymentMethod,
          notes || null,
        ]
      );

      const createdOrder = orderResult.rows[0];

      // 3. Insert order items & decrement inventory stock atomically
      const insertedItems = [];
      for (const item of verifiedItems) {
        const itemRes = await client.query(
          `
          INSERT INTO public.order_items (
            order_id, product_id, product_name, product_image, unit_price, quantity, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
          `,
          [
            createdOrder.id,
            item.productId,
            item.name,
            item.image,
            item.unitPrice,
            item.quantity,
            item.totalPrice,
          ]
        );
        insertedItems.push(itemRes.rows[0]);

        await client.query(
          "UPDATE public.products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2",
          [item.quantity, item.productId]
        );
      }

      // 4. Save customer's full_name during their first checkout if not yet stored
      if (request.customer?.id && !request.customer.fullName && customerName) {
        await client.query(
          "UPDATE public.customers SET full_name = $1, updated_at = NOW() WHERE id = $2",
          [customerName.trim(), request.customer.id]
        );
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

  // GET /api/orders/:orderNumber - Track order status by order number (public status summary)
  fastify.get("/:orderNumber", async (request, reply) => {
    try {
      const { orderNumber } = request.params;
      const orderRes = await db.query(
        `
        SELECT id, order_number, shipping_address, subtotal, tax, shipping_charge,
               total_amount, payment_method, payment_status, order_status, created_at
        FROM public.orders
        WHERE order_number = $1
        LIMIT 1
        `,
        [orderNumber]
      );

      if (orderRes.rows.length === 0) {
        reply.status(404);
        return { success: false, message: "Order not found" };
      }

      const order = orderRes.rows[0];
      const itemsRes = await db.query(
        "SELECT id, product_id, product_name, product_image, unit_price, quantity, total_price FROM public.order_items WHERE order_id = $1",
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
