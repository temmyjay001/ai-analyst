// lib/encryption.ts
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = "aes-256-gcm";

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error(
    "ENCRYPTION_KEY must be exactly 32 characters long. Generate one with: openssl rand -base64 32"
  );
}

export function encrypt(text: string): string {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get the auth tag
    const authTag = cipher.getAuthTag();

    // Combine iv + authTag + encrypted data
    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

export function decrypt(encryptedData: string): string {
  try {
    // Split the encrypted data
    const parts = encryptedData.split(":");

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Set the auth tag
    decipher.setAuthTag(authTag);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}
