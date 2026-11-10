const fastify = require("fastify")({
  logger: true,
});
const cors = require("@fastify/cors");
const dotenv = require("dotenv");
const path = require("path");
const db = require("./db");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = parseInt(process.env.PORT, 10) || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

async function buildServer() {
  // 1. CORS plugin
  await fastify.register(cors, {
    origin: [FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  // 2. Register modular route plugins
  await fastify.register(require("./routes/products"), { prefix: "/api/products" });
  await fastify.register(require("./routes/orders"), { prefix: "/api/orders" });
  await fastify.register(require("./routes/inquiries"), { prefix: "/api/inquiries" });

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
        products: "/api/products",
        orders: "/api/orders",
        inquiries: "/api/inquiries",
      },
    };
  });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🎱 Hyderabad Cue Sports Fastify server is running on http://localhost:${PORT}`);
    console.log("📡 Connected to Supabase PostgreSQL database");
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Start server if executed directly
if (require.main === module) {
  start();
}

module.exports = buildServer;
