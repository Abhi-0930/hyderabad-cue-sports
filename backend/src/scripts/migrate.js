const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runMigration() {
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!directUrl) {
    console.error("❌ DIRECT_URL or DATABASE_URL is missing in backend/.env");
    process.exit(1);
  }

  console.log("🚀 Connecting to Supabase PostgreSQL at aws-1-ap-northeast-1.pooler.supabase.com...");
  
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log("✅ Successfully connected to Supabase PostgreSQL!");

    // 1. Run Schema
    const schemaPath = path.resolve(__dirname, "../../schema.sql");
    console.log(`📄 Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    console.log("⚡ Executing schema migration (tables, indexes, RLS policies)...");
    await client.query(schemaSql);
    console.log("✅ Schema successfully applied!");

    // 2. Run Seed
    const seedPath = path.resolve(__dirname, "../../seed.sql");
    if (fs.existsSync(seedPath)) {
      console.log(`🌱 Reading seed data from ${seedPath}...`);
      const seedSql = fs.readFileSync(seedPath, "utf-8");
      console.log("⚡ Inserting initial cue sports products and accessories...");
      await client.query(seedSql);
      console.log("✅ Seed data successfully inserted!");
    }

    // 3. Verification query
    const res = await client.query("SELECT COUNT(*) AS total_products FROM public.products;");
    console.log(`🎉 Verification complete: ${res.rows[0].total_products} products are now live in your Supabase database!`);

  } catch (err) {
    console.error("❌ Migration failed with error:", err.message);
    if (err.detail) console.error("Details:", err.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

