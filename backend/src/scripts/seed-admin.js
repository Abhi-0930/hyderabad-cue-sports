const crypto = require("crypto");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const db = require("../db");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

async function seedAdmin() {
  console.log("🔒 Initializing public.admin_users table in PostgreSQL...");

  await db.query(`
    CREATE TABLE IF NOT EXISTS public.admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL DEFAULT 'Administrator',
      role TEXT NOT NULL DEFAULT 'superadmin' CHECK (role IN ('superadmin', 'admin', 'manager')),
      is_active BOOLEAN DEFAULT true,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

    ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Deny public direct access to admin_users" ON public.admin_users;
    CREATE POLICY "Deny public direct access to admin_users"
    ON public.admin_users FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);
  `);

  console.log("✅ public.admin_users table & RLS policies verified.");

  const email = "admin@hyderabadcuesports.in";
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || "Admin@HCS2026";
  const passwordHash = hashPassword(initialPassword);

  const res = await db.query(
    `
    INSERT INTO public.admin_users (email, password_hash, full_name, role, is_active)
    VALUES ($1, $2, 'HCS Administrator', 'superadmin', true)
    ON CONFLICT (email) 
    DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()
    RETURNING id, email, full_name, role, is_active, created_at;
    `,
    [email, passwordHash]
  );

  console.log("👑 Admin user seeded successfully in PostgreSQL:");
  console.log(res.rows[0]);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Failed to seed admin user:", err);
  process.exit(1);
});
