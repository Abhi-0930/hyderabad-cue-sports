const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const HASH_SECRET = process.env.HASH_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!HASH_SECRET) {
  throw new Error("Missing required environment variable: HASH_SECRET in backend/.env");
}

if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, "hex").length !== 32) {
  throw new Error(
    "Missing or invalid ENCRYPTION_KEY in backend/.env (must be 64 hex characters / 32 bytes)"
  );
}

if (!JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET in backend/.env");
}

const AES_KEY = Buffer.from(ENCRYPTION_KEY, "hex");
const SESSION_DAYS = 30;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

/**
 * Normalize Indian mobile numbers to consistent +91XXXXXXXXXX format.
 */
function normalizePhone(rawPhone) {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return `+${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

/**
 * Normalize and validate email addresses.
 */
function normalizeEmail(rawEmail) {
  const trimmed = String(rawEmail || "").trim().toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  return isValid ? trimmed : null;
}

/**
 * Deterministic HMAC-SHA256 blind-index hash for fast, private database lookups.
 */
function hashBlindIndex(value) {
  return crypto.createHmac("sha256", HASH_SECRET).update(String(value)).digest("hex");
}

/**
 * One-way SHA-256 hash for session tokens and OTPs.
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

/**
 * Reversible AES-256-GCM encryption for storing PII safely at rest in PostgreSQL.
 */
function encryptPII(plaintext) {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", AES_KEY, iv);
  let encrypted = cipher.update(String(plaintext), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM ciphertext back to plaintext for authorized server-side usage.
 */
function decryptPII(payload) {
  if (!payload) return null;
  const parts = String(payload).split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted PII payload format");
  }
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    AES_KEY,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function maskPhone(phone) {
  if (!phone || phone.length < 4) return "****";
  return `${phone.slice(0, 3)} ******${phone.slice(-4)}`;
}

function maskEmail(email) {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}

function signSessionJwt(payload, expiresIn = `${SESSION_DAYS}d`) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifySessionJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  SESSION_DAYS,
  SESSION_MAX_AGE_SECONDS,
  normalizePhone,
  normalizeEmail,
  hashBlindIndex,
  hashToken,
  encryptPII,
  decryptPII,
  maskPhone,
  maskEmail,
  signSessionJwt,
  verifySessionJwt,
};

