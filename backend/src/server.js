const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const db = require("./db");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Middlewares
app.use(cors({
  origin: [FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
}));
app.use(express.json());

// Routes
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");
const inquiriesRouter = require("./routes/inquiries");

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/inquiries", inquiriesRouter);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const dbRes = await db.query("SELECT NOW() as current_time, COUNT(*) as product_count FROM public.products");
    res.json({
      status: "online",
      database: "connected",
      cloud: "Supabase PostgreSQL",
      time: dbRes.rows[0].current_time,
      productsCount: dbRes.rows[0].product_count,
    });
  } catch (err) {
    res.status(500).json({
      status: "degraded",
      database: "disconnected",
      error: err.message,
    });
  }
});

// Root API index
app.get("/", (req, res) => {
  res.json({
    message: "Hyderabad Cue Sports Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      orders: "/api/orders",
      inquiries: "/api/inquiries",
    },
  });
});

app.listen(PORT, () => {
  console.log(`🎱 Hyderabad Cue Sports Backend is running on http://localhost:${PORT}`);
  console.log(`📡 Connected to Supabase PostgreSQL: aws-1-ap-northeast-1.pooler.supabase.com`);
});

