import { encrypt, decrypt } from "./encrypt";

export interface AiProviderConfig {
  id: string;
  type: string;
  modelName: string;
  apiKey: string;
  isDefault: boolean;
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.includes("•")) return key;
  
  let rawKey = key;
  if (isEncrypted(key)) {
    try {
      rawKey = decrypt(key);
    } catch (e) {
      // Use as-is if decryption fails
    }
  }
  
  if (rawKey.length <= 8) return "••••••••";
  return `${rawKey.slice(0, 4)}••••${rawKey.slice(-4)}`;
}

export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(":");
  return (
    parts.length === 3 &&
    /^[0-9a-fA-F]+$/.test(parts[0]) &&
    /^[0-9a-fA-F]+$/.test(parts[1]) &&
    /^[0-9a-fA-F]+$/.test(parts[2])
  );
}

export function getDecryptedKey(key: string): string {
  if (!key) return "";
  if (isEncrypted(key)) {
    try {
      return decrypt(key);
    } catch (e) {
      return key;
    }
  }
  return key;
}

export function getEncryptedKey(key: string): string {
  if (!key) return "";
  if (isEncrypted(key)) return key;
  return encrypt(key);
}
