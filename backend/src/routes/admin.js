const crypto = require("crypto");
const db = require("../db");
const { signSessionJwt, verifySessionJwt, normalizeEmail, decryptPII } = require("../utils/crypto");

const ADMIN_COOKIE_NAME = "hcs_admin_session";

function getAuthenticatedAdmin(request) {
  const cookieToken = request.cookies?.[ADMIN_COOKIE_NAME];
  const authHeader = request.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const token = cookieToken || bearerToken;
  if (!token) return null;

  try {
    const decoded = verifySessionJwt(token);
    if (!decoded || !decoded.id || !["superadmin", "admin", "manager"].includes(decoded.role)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify a candidate password against the stored scrypt hash string: scrypt:<saltHex>:<hashHex>
 */
function verifyPassword(candidatePassword, storedHash) {
  if (!candidatePassword || !storedHash || typeof storedHash !== "string") {
    return false;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const saltHex = parts[1];
  const expectedHashHex = parts[2];
  const expectedBuffer = Buffer.from(expectedHashHex, "hex");

  const derivedBuffer = crypto.scryptSync(candidatePassword, saltHex, 64);
  return (
    expectedBuffer.length === derivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, derivedBuffer)
  );
}

/**
 * Fastify plugin for Admin Authentication and Administration routes backed by PostgreSQL
 * @param {import('fastify').FastifyInstance} fastify
 */
async function adminRoutes(fastify) {
  // Rate limiter specifically for admin login attempts (5 attempts per minute per IP)
  const adminLoginRateLimit = {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
        errorResponseBuilder: (request, context) => ({
          success: false,
          statusCode: 429,
          message: `Too many failed admin login attempts. Please wait ${Math.ceil(context.ttl / 1000)} seconds before trying again.`,
        }),
      },
    },
  };

  // POST /api/admin/login - Authenticate admin against public.admin_users in PostgreSQL
  fastify.post("/login", adminLoginRateLimit, async (request, reply) => {
    try {
      const { email: rawEmail, password } = request.body || {};
      const email = normalizeEmail(rawEmail);

      if (!email || !password || typeof password !== "string") {
        reply.status(400);
        return {
          success: false,
          message: "Please enter your admin email and password.",
        };
      }

      // 1. Query the database for the active admin user
      const { rows } = await db.query(
        `
        SELECT id, email, password_hash, full_name, role, is_active
        FROM public.admin_users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [email]
      );

      if (rows.length === 0) {
        request.log.warn({ email, ip: request.ip }, "Admin login failed: Email not found.");
        reply.status(401);
        return {
          success: false,
          message: "Invalid admin email or password.",
        };
      }

      const adminUser = rows[0];

      if (!adminUser.is_active) {
        request.log.warn({ email, ip: request.ip }, "Admin login blocked: Account deactivated.");
        reply.status(403);
        return {
          success: false,
          message: "This admin account is deactivated. Please contact the administrator.",
        };
      }

      // 2. Constant-time salted scrypt password verification
      const isPasswordValid = verifyPassword(password, adminUser.password_hash);
      if (!isPasswordValid) {
        request.log.warn({ email, ip: request.ip }, "Admin login failed: Password mismatch.");
        reply.status(401);
        return {
          success: false,
          message: "Invalid admin email or password.",
        };
      }

      // 3. Update last_login_at timestamp in PostgreSQL
      await db.query(
        "UPDATE public.admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
        [adminUser.id]
      );

      // 4. Issue admin JWT session token
      const adminPayload = {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: adminUser.role,
        issuedAt: Date.now(),
      };
      const token = signSessionJwt(adminPayload, "7d");

      // 5. Attach secure httpOnly cookie
      const isProduction = process.env.NODE_ENV === "production";
      reply.setCookie(ADMIN_COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return {
        success: true,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          fullName: adminUser.full_name,
          role: adminUser.role,
          token,
        },
      };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      const isDbTimeout =
        err.message?.includes("Connection terminated") ||
        err.message?.includes("connection timeout") ||
        err.message?.includes("ETIMEDOUT");

      return {
        success: false,
        message: isDbTimeout
          ? "Database connection timed out. If on a college or restricted Wi-Fi network, port 6543 is blocked — please switch to mobile hotspot."
          : "An internal database or authentication error occurred.",
        error: err.message,
      };
    }
  });

  // GET /api/admin/me - Verify current admin session against PostgreSQL
  fastify.get("/me", async (request, reply) => {
    try {
      const cookieToken = request.cookies?.[ADMIN_COOKIE_NAME];
      const authHeader = request.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;

      const token = cookieToken || bearerToken;
      if (!token) {
        reply.status(401);
        return { success: false, message: "Unauthenticated admin session." };
      }

      const decoded = verifySessionJwt(token);
      if (!decoded || !decoded.id || !["superadmin", "admin", "manager"].includes(decoded.role)) {
        reply.status(401);
        return { success: false, message: "Invalid or expired admin session token." };
      }

      // Verify that the user still exists and remains active in PostgreSQL
      const { rows } = await db.query(
        "SELECT id, email, full_name, role, is_active FROM public.admin_users WHERE id = $1 LIMIT 1",
        [decoded.id]
      );

      if (rows.length === 0 || !rows[0].is_active) {
        reply.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
        reply.status(401);
        return { success: false, message: "Admin account no longer active." };
      }

      const user = rows[0];
      return {
        success: true,
        admin: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      };
    } catch (err) {
      reply.status(401);
      return { success: false, message: "Session expired or invalid." };
    }
  });

  // POST /api/admin/logout - Clear admin session cookie
  fastify.post("/logout", async (request, reply) => {
    reply.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
    return { success: true, message: "Logged out successfully." };
  });

  // GET /api/admin/customers - List all registered customers from PostgreSQL with decrypted contact info
  fastify.get("/customers", async (request, reply) => {
    const admin = getAuthenticatedAdmin(request);
    if (!admin) {
      reply.status(401);
      return { success: false, message: "Unauthorized admin request." };
    }

    try {
      const customersRes = await db.query(`
        SELECT c.id, c.full_name, c.phone_encrypted, c.email_encrypted, c.is_phone_verified,
               c.status, c.segment, c.notes, c.created_at,
               COALESCE(COUNT(o.id), 0)::int AS order_count,
               COALESCE(SUM(o.total_amount), 0)::numeric AS total_spent
        FROM public.customers c
        LEFT JOIN public.orders o ON o.customer_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);

      const addressesRes = await db.query(`
        SELECT id, customer_id, label, recipient_name, phone_encrypted, address_line1, address_line2, city, state, pincode
        FROM public.customer_addresses
        ORDER BY is_default DESC, created_at DESC
      `);

      const addressesByCustomer = new Map();
      for (const addr of addressesRes.rows) {
        if (!addressesByCustomer.has(addr.customer_id)) {
          addressesByCustomer.set(addr.customer_id, []);
        }
        const fullAddress = [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
        addressesByCustomer.get(addr.customer_id).push({
          label: addr.label || "Home",
          address: fullAddress || "Address on file",
        });
      }

      const formatted = customersRes.rows.map((row) => {
        let phone = "";
        let email = "";
        try {
          phone = row.phone_encrypted ? decryptPII(row.phone_encrypted) : "";
        } catch {
          phone = "";
        }
        try {
          email = row.email_encrypted ? decryptPII(row.email_encrypted) : "";
        } catch {
          email = "";
        }

        const rawName = row.full_name || (email ? email.split("@")[0] : phone ? `Customer (${phone.slice(-4)})` : "Verified Customer");
        const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        const initials = name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "CU";

        return {
          id: row.id,
          name,
          email: email || "Not provided",
          mobile: phone || "Not provided",
          joined: new Date(row.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          orders: Number(row.order_count) || 0,
          spent: Number(row.total_spent) || 0,
          segment: row.segment || "Retail",
          initials,
          status: row.status || (row.is_phone_verified ? "Active" : "Active"),
          addresses: addressesByCustomer.get(row.id) || [],
          notes: row.notes || "Registered customer via storefront phone verification.",
          recentActivity: [
            {
              label: "Account registered",
              date: new Date(row.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
            },
          ],
        };
      });

      return { success: true, count: formatted.length, data: formatted };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Failed to fetch customers", error: err.message };
    }
  });

  // PATCH /api/admin/customers/:id - Update customer notes, segment, or status
  fastify.patch("/customers/:id", async (request, reply) => {
    const admin = getAuthenticatedAdmin(request);
    if (!admin) {
      reply.status(401);
      return { success: false, message: "Unauthorized admin request." };
    }

    const { id } = request.params;
    const { status, notes, segment } = request.body || {};

    try {
      const updates = [];
      const values = [];
      let idx = 1;

      if (status !== undefined) {
        updates.push(`status = $${idx++}`);
        values.push(status);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${idx++}`);
        values.push(notes);
      }
      if (segment !== undefined) {
        updates.push(`segment = $${idx++}`);
        values.push(segment);
      }

      if (updates.length === 0) {
        return { success: true, message: "No changes requested." };
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE public.customers
        SET ${updates.join(", ")}
        WHERE id = $${idx}
        RETURNING id, status, notes, segment
      `;

      const { rows } = await db.query(query, values);
      if (rows.length === 0) {
        reply.status(404);
        return { success: false, message: "Customer not found." };
      }

      return { success: true, customer: rows[0] };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Failed to update customer." };
    }
  });

  // =========================================================================
  // ADMIN PRODUCTS MANAGEMENT
  // =========================================================================

  // GET /api/admin/products - List all products with admin metadata
  fastify.get("/products", async (request, reply) => {
    try {
      const { rows } = await db.query(`
        SELECT * FROM public.products
        ORDER BY updated_at DESC, created_at DESC
      `);

      const formatted = rows.map((r) => {
        const extra = r.extra_meta || {};
        return {
          id: r.id,
          name: r.name,
          category: r.category,
          subcategory: extra.subcategory || "General",
          sku: r.sku || extra.sku || r.id,
          price: Number(r.price) || 0,
          salePrice: Number(r.compare_at) || 0,
          inventory: Number(r.stock_quantity) || 0,
          status: r.availability || "In stock",
          publication: r.publication_status || "Published",
          brand: r.brand || extra.brand || "HCS Studio",
          accent: extra.accent || "#c5d6c3",
          initials: r.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "HC",
          shortDescription: extra.shortDescription || r.description?.slice(0, 160) || "",
          description: r.description || "",
          tax: extra.tax || "GST 18%",
          lowStockThreshold: extra.lowStockThreshold ?? 2,
          weight: extra.weight || "",
          dimensions: r.size || extra.dimensions || "",
          specs: r.specs && typeof r.specs === "object" ? r.specs : {},
          featured: Boolean(r.is_featured),
          bestseller: Boolean(extra.bestseller),
          newArrival: Boolean(extra.newArrival),
          seoTitle: extra.seoTitle || r.name,
          seoDescription: extra.seoDescription || r.description?.slice(0, 160) || "",
          slug: r.slug,
          imageCount: Array.isArray(r.gallery) ? r.gallery.length : 1,
          images: Array.isArray(r.gallery) && r.gallery.length > 0 ? r.gallery : [r.image],
          primaryImage: r.image,
          productType: r.type === "table" ? "Physical Product" : extra.productType || "Physical Product",
          collection: extra.collection || "",
          feeMode: extra.feeMode || "on_top",
          platformFeeType: extra.platformFeeType || "Percentage",
          platformFeeValue: extra.platformFeeValue ?? 5,
          trackStock: extra.trackStock !== false,
          allowBackorders: Boolean(extra.allowBackorders),
          minOrderQuantity: extra.minOrderQuantity || 1,
          variants: extra.variants || [],
          customSpecs: extra.customSpecs || [],
          shippingSkip: Boolean(extra.shippingSkip),
          shippingClass: extra.shippingClass || "Standard",
          deliveryType: extra.deliveryType || "Standard Delivery",
          shippingCharges: extra.shippingCharges || "Fixed Charge",
          installationRequired: Boolean(extra.installationRequired),
          installationType: extra.installationType || "",
          warrantyInfo: extra.warrantyInfo || "",
          returnEligibility: extra.returnEligibility || "",
          measurementUnit: extra.measurementUnit || "cm",
          packageLength: extra.packageLength || "",
          packageWidth: extra.packageWidth || "",
          packageHeight: extra.packageHeight || "",
          focusKeyword: extra.focusKeyword || "",
          canonicalUrl: extra.canonicalUrl || "",
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      });

      return { success: true, count: formatted.length, data: formatted };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Failed to fetch products", error: err.message };
    }
  });

  // POST /api/admin/products - Create or update a product in PostgreSQL
  fastify.post("/products", async (request, reply) => {
    try {
      const prod = request.body || {};
      if (!prod.name || !prod.name.trim()) {
        reply.status(400);
        return { success: false, message: "Product name is required" };
      }
      if (!prod.sku || !prod.sku.trim()) {
        reply.status(400);
        return { success: false, message: "Unique SKU is required" };
      }

      const id = prod.id || `prod-${Date.now()}`;
      const baseSlug = prod.slug?.trim() || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const name = prod.name.trim();
      const sku = prod.sku.trim().toUpperCase();
      const brand = prod.brand || "HCS Studio";
      const category = prod.category || "Tables";
      const type = category.toLowerCase().includes("table") ? "table" : "accessory";
      const size = prod.dimensions || prod.size || "Standard";
      const price = Number(prod.price) || 0;
      const compare_at = Number(prod.salePrice) || null;
      const image = prod.primaryImage || prod.images?.[0] || prod.image || "/images/products/featured-table-12ft.jpg";
      const gallery = JSON.stringify(prod.images || [image]);
      const badge = prod.featured ? "Featured" : prod.bestseller ? "Best Seller" : prod.newArrival ? "New Arrival" : null;
      const availability = prod.status || "In stock";
      const description = prod.description || prod.shortDescription || "";
      const details = JSON.stringify(Array.isArray(prod.details) ? prod.details : []);
      const specs = JSON.stringify(typeof prod.specs === "object" ? prod.specs : {});
      const tags = [prod.category, prod.brand, prod.productType].filter(Boolean);
      const stock_quantity = Number(prod.inventory) || 0;
      const is_featured = Boolean(prod.featured);
      const publication_status = prod.publication || "Published";

      // Prevent duplicate slug collision with a different product ID
      let slug = baseSlug;
      const slugCheck = await db.query(
        "SELECT id FROM public.products WHERE slug = $1 AND id != $2 LIMIT 1",
        [slug, id]
      );
      if (slugCheck.rows.length > 0) {
        slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }

      const extra_meta = JSON.stringify({
        subcategory: prod.subcategory,
        shortDescription: prod.shortDescription,
        tax: prod.tax,
        lowStockThreshold: prod.lowStockThreshold,
        weight: prod.weight,
        dimensions: prod.dimensions,
        productType: prod.productType,
        collection: prod.collection,
        feeMode: prod.feeMode,
        platformFeeType: prod.platformFeeType,
        platformFeeValue: prod.platformFeeValue,
        trackStock: prod.trackStock,
        allowBackorders: prod.allowBackorders,
        minOrderQuantity: prod.minOrderQuantity,
        variants: prod.variants,
        customSpecs: prod.customSpecs,
        shippingSkip: prod.shippingSkip,
        shippingClass: prod.shippingClass,
        deliveryType: prod.deliveryType,
        shippingCharges: prod.shippingCharges,
        installationRequired: prod.installationRequired,
        installationType: prod.installationType,
        warrantyInfo: prod.warrantyInfo,
        returnEligibility: prod.returnEligibility,
        measurementUnit: prod.measurementUnit,
        packageLength: prod.packageLength,
        packageWidth: prod.packageWidth,
        packageHeight: prod.packageHeight,
        seoTitle: prod.seoTitle,
        seoDescription: prod.seoDescription,
        focusKeyword: prod.focusKeyword,
        canonicalUrl: prod.canonicalUrl,
        bestseller: prod.bestseller,
        newArrival: prod.newArrival,
      });

      const upsertQuery = `
        INSERT INTO public.products (
          id, slug, name, sku, brand, category, type, size, price, compare_at,
          image, gallery, badge, availability, description, details, specs,
          tags, stock_quantity, is_featured, publication_status, extra_meta,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22,
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          sku = EXCLUDED.sku,
          brand = EXCLUDED.brand,
          category = EXCLUDED.category,
          type = EXCLUDED.type,
          size = EXCLUDED.size,
          price = EXCLUDED.price,
          compare_at = EXCLUDED.compare_at,
          image = EXCLUDED.image,
          gallery = EXCLUDED.gallery,
          badge = EXCLUDED.badge,
          availability = EXCLUDED.availability,
          description = EXCLUDED.description,
          details = EXCLUDED.details,
          specs = EXCLUDED.specs,
          tags = EXCLUDED.tags,
          stock_quantity = EXCLUDED.stock_quantity,
          is_featured = EXCLUDED.is_featured,
          publication_status = EXCLUDED.publication_status,
          extra_meta = EXCLUDED.extra_meta,
          updated_at = NOW()
        RETURNING *;
      `;

      const values = [
        id, slug, name, sku, brand, category, type, size, price, compare_at,
        image, gallery, badge, availability, description, details, specs,
        tags, stock_quantity, is_featured, publication_status, extra_meta,
      ];

      const { rows } = await db.query(upsertQuery, values);
      request.log.info({ productId: rows[0].id, name: rows[0].name, status: publication_status }, "Product saved to PostgreSQL");
      return { success: true, product: rows[0] };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Failed to save product", error: err.message };
    }
  });

  // DELETE /api/admin/products/:id - Delete product from PostgreSQL
  fastify.delete("/products/:id", async (request, reply) => {
    const { id } = request.params;
    try {
      const { rowCount } = await db.query("DELETE FROM public.products WHERE id = $1", [id]);
      if (rowCount === 0) {
        reply.status(404);
        return { success: false, message: "Product not found" };
      }
      return { success: true, message: "Product deleted" };
    } catch (err) {
      request.log.error(err);
      reply.status(500);
      return { success: false, message: "Failed to delete product", error: err.message };
    }
  });
}

module.exports = adminRoutes;
