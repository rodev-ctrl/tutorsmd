import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { CRYPTO } from "./crypto";
import ApiError from "../../domain/errors/apiError";

export function encrypt(text: string) {
  const iv: Buffer = randomBytes(16);

  const cipher = createCipheriv(
    CRYPTO.algorithm,
    CRYPTO.key,
    iv
  );

  const encrypted =
    cipher.update(text, "utf8", "hex") + cipher.final("hex");

  return `${iv.toString("hex")}_${encrypted}`;
}

export function decrypt(packed: string) {
    if (!/^[0-9a-fA-F]{32}_[0-9a-fA-F]+$/.test(packed)) {
        throw ApiError.BadRequest("Invalid encrypted format");
      }
      
  const [ivHex, encrypted] = packed.split("_");

  const iv: Buffer = Buffer.from(ivHex, "hex");

  const decipher = createDecipheriv(
    CRYPTO.algorithm,
    CRYPTO.key,
    iv
  );

  return (
    decipher.update(encrypted, "hex", "utf8") +
    decipher.final("utf8")
  );
}


