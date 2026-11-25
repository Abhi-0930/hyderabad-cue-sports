const fastify = require("fastify")({
  logger: true,
});
const cors = require("@fastify/cors");
const cookie = require("@fastify/cookie");
const helmet = require("@fastify/helmet");
const rateLimit = require("@fastify/rate-limit");
const dotenv = require("dotenv");
const path = require("path");
const db = require("./db");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = Number(process.env.PORT);
const FRONTEND_URL = process.env.FRONTEND_URL;
const COOKIE_SECRET = process.env.COOKIE_SECRET;

if (!PORT || Number.isNaN(PORT)) {
  throw new Error("Missing or invalid required environment variable: PORT in backend/.env");
}

if (!FRONTEND_URL) {
  throw new Error("Missing required environment variable: FRONTEND_URL in backend/.env");
}

if (!COOKIE_SECRET) {
  throw new Error("Missing required environment variable: COOKIE_SECRET in backend/.env");
}

async function buildServer() {
  // 1. HTTP Security Armor (Helmet)
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  });

  // 2. Global Rate Limiter (120 req/min per IP)
  await fastify.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: `Too many requests from this IP. Please wait ${Math.ceil(context.ttl / 1000)} seconds before trying again.`,
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
  });

  const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (
      origin === FRONTEND_URL ||
      origin === "http://localhost:3000" ||
      origin === "http://127.0.0.1:3000" ||
      origin === "http://localhost:3001" ||
      origin === "http://127.0.0.1:3001" ||
      origin === "http://localhost:5000" ||
      origin === "http://127.0.0.1:5000"
    ) {
      return true;
    }
    try {
      const parsed = new URL(origin);
      const hostname = parsed.hostname;
      // Localhost / Loopback
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
        return true;
      }
      // Private LAN subnets (RFC 1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      if (
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)
      ) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  // 3. CORS & Signed Cookies
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error("CORS policy violation: unauthorized origin"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await fastify.register(cookie, {
    secret: COOKIE_SECRET,
  });

  // 4. Strict CSRF Guard on state-changing requests (POST, PUT, PATCH, DELETE)
  fastify.addHook("preHandler", async (request, reply) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      const origin = request.headers.origin;
      if (origin && !isAllowedOrigin(origin)) {
        request.log.warn({ origin }, "CSRF Alert: Unauthorized request origin blocked.");
        reply.status(403);
        throw new Error("Cross-origin request blocked by security policy.");
      }
    }
  });

  // 5. Global Sanitized Error Handler (Zero database or stack-trace leakage)
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const statusCode =
      error.statusCode && error.statusCode >= 400 && error.statusCode < 500
        ? error.statusCode
        : error.status && error.status >= 400 && error.status < 500
        ? error.status
        : 500;

    const message =
      statusCode === 500
        ? "An unexpected security or server error occurred. Please try again later."
        : error.message || "Request failed.";

    reply.status(statusCode).send({
      success: false,
      statusCode,
      message,
    });
  });

  // 6. Register modular route plugins
  await fastify.register(require("./routes/auth"), { prefix: "/api/auth" });
  await fastify.register(require("./routes/customer"), { prefix: "/api/customer" });
  await fastify.register(require("./routes/products"), { prefix: "/api/products" });
  await fastify.register(require("./routes/orders"), { prefix: "/api/orders" });
  await fastify.register(require("./routes/inquiries"), { prefix: "/api/inquiries" });
  await fastify.register(require("./routes/admin"), { prefix: "/api/admin" });

  // 3. Health check route with Supabase ping
  fastify.get("/api/health", async (request, reply) => {
    try {
      const dbRes = await db.query(
        "SELECT NOW() as current_time, COUNT(*) as product_count FROM public.products"
      );
      return {
        status: "online",
        framework: "Fastify",
        database: "connected",
        cloud: "Supabase PostgreSQL",
        time: dbRes.rows[0].current_time,
        productsCount: parseInt(dbRes.rows[0].product_count, 10),
      };
    } catch (err) {
      reply.status(500);
      return {
        status: "degraded",
        framework: "Fastify",
        database: "disconnected",
        error: err.message,
      };
    }
  });

  // 4. Root API metadata
  fastify.get("/", async () => {
    return {
      message: "Hyderabad Cue Sports Fastify Backend API",
      version: "1.0.0",
      framework: "Fastify",
      endpoints: {
        health: "/api/health",
        auth: "/api/auth",
        customer: "/api/customer",
        products: "/api/products",
        orders: "/api/orders",
        inquiries: "/api/inquiries",
      },
    };
  });

  return fastify;
}

async function pruneExpiredSessions() {
  try {
    const res = await db.query(
      "DELETE FROM public.auth_sessions WHERE expires_at < NOW()"
    );
    if (res.rowCount > 0) {
      console.log(`🧹 Pruned ${res.rowCount} expired auth sessions.`);
    }
  } catch (err) {
    console.error("Failed to prune expired sessions:", err.message);
  }
}

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🎱 Hyderabad Cue Sports Fastify server is running on http://localhost:${PORT}`);
    console.log("📡 Connected to Supabase PostgreSQL database");

    // Run garbage collection on startup and every hour
    await pruneExpiredSessions();
    setInterval(pruneExpiredSessions, 60 * 60 * 1000).unref();
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = buildServer;
