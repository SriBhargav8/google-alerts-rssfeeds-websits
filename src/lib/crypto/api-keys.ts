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
  
  return "••••••••";
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

const SENSITIVE_KEYS = ["password", "application_password", "apikey", "apisecret", "accesstoken", "accesssecret", "token", "secret", "key"];

export function encryptIntegrationCredentials(credentials: any): any {
  if (!credentials || typeof credentials !== "object") return credentials;
  
  const encrypted = { ...credentials };
  for (const [key, value] of Object.entries(encrypted)) {
    if (typeof value === "string" && SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      encrypted[key] = getEncryptedKey(value);
    }
  }
  return encrypted;
}

export function decryptIntegrationCredentials(credentials: any): any {
  if (!credentials || typeof credentials !== "object") return credentials;
  
  const decrypted = { ...credentials };
  for (const [key, value] of Object.entries(decrypted)) {
    if (typeof value === "string" && SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      decrypted[key] = getDecryptedKey(value);
    }
  }
  return decrypted;
}

export function maskIntegrationCredentials(credentials: any): any {
  if (!credentials || typeof credentials !== "object") return credentials;
  
  const masked = { ...credentials };
  for (const [key, value] of Object.entries(masked)) {
    if (typeof value === "string" && SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      masked[key] = maskApiKey(value);
    }
  }
  return masked;
}

export function mergeIntegrationCredentials(incoming: any, existing: any): any {
  if (!incoming || typeof incoming !== "object") return incoming;
  if (!existing || typeof existing !== "object") return incoming;
  
  const merged = { ...incoming };
  for (const [key, value] of Object.entries(merged)) {
    if (typeof value === "string" && value.includes("•")) {
      merged[key] = existing[key];
    } else if (typeof value === "string" && SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      merged[key] = getEncryptedKey(value);
    }
  }
  return merged;
}
