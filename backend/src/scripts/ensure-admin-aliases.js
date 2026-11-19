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

async function addAliases() {
  const password = process.env.ADMIN_INITIAL_PASSWORD || "Admin@HCS2026";
  const hash = hashPassword(password);
  const emails = [
    "admin@hyderabadcuesports.in",
    "admin@hyderabadcuesports.com",
    "admin@hcs.com",
    "admin@hcs.in",
  ];

  for (const email of emails) {
    await db.query(
      `
      INSERT INTO public.admin_users (email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, 'HCS Administrator', 'superadmin', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, is_active = true, updated_at = NOW()
    `,
      [email, hash]
    );
    console.log("✅ Ensured admin account:", email);
  }
  console.log("All admin accounts ready with password:", password);
}

addAliases()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error setting up aliases:", e);
    process.exit(1);
  });
