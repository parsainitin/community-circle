import crypto from "crypto";

// Key-stretching password hashing using Node's native scrypt (OWASP recommended)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  // Handle scrypt salted hashes
  if (storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const originalDerivedKey = parts[2];
    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derivedKey, "hex"), Buffer.from(originalDerivedKey, "hex"));
  }

  // Backward compatibility fallback for legacy SHA-256 hashes
  const legacySha256 = crypto.createHash("sha256").update(password).digest("hex");
  return legacySha256 === storedHash;
}
