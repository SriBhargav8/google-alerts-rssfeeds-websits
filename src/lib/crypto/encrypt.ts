import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = process.env.ENCRYPTION_SECRET || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY, "hex"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decrypt(text: string) {
  const parts = text.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted text format");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");
  const authTag = Buffer.from(parts[2], "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY, "hex"), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, undefined, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
