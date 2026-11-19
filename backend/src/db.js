const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing required environment variable: DATABASE_URL in backend/.env");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle Postgres client", err);
});

async function queryWithRetry(text, params, maxRetries = 2) {
  let attempt = 0;
  while (true) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      attempt++;
      const isConnectionError =
        err.code === "ECONNRESET" ||
        err.code === "57P01" ||
        err.code === "08006" ||
        err.code === "08001" ||
        err.message?.includes("Connection terminated") ||
        err.message?.includes("connection timeout") ||
        err.message?.includes("closed");
      if (isConnectionError && attempt <= maxRetries) {
        console.warn(
          `[db] Transient connection error on query (attempt ${attempt}/${maxRetries}), retrying...`,
          err.message
        );
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      throw err;
    }
  }
}

module.exports = {
  query: queryWithRetry,
  pool,
};
