// AES-256-GCM

import { randomBytes, createCipheriv, createDecipheriv, CipherGCM, DecipherGCM } from "node:crypto";
import { CRYPTO } from "./crypto";

export function encrypt(text: string): string {
  const iv: Buffer = randomBytes(12); // GCM использует 12 байт

  const cipher = createCipheriv(
    CRYPTO.algorithm,
    CRYPTO.key,
    iv
  ) as CipherGCM;

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag(); // ← аутентификация

  // return `${iv.toString("hex")}_${encrypted}`;
   // Упаковываем всё в один base64 буфер: iv(12) + authTag(16) + encrypted
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decrypt(packed: string): string {
    if (!/^[0-9a-fA-F]{32}_[0-9a-fA-F]+$/.test(packed)) {
        throw new Error('Invalid encrypted format');
      }
  let data: Buffer;

  try {
    data = Buffer.from(packed, 'base64');
  } catch {
    throw new Error('Invalid encrypted format');
  }
      
  // const [ivHex, encrypted] = packed.split("_");

  // const iv: Buffer = Buffer.from(ivHex, "hex");

    // Минимальная длина: iv(12) + authTag(16) + хотя бы 1 байт данных
  if (data.length < 29) {
    throw new Error('Invalid encrypted format');
  }

  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);

  const decipher = createDecipheriv(
    CRYPTO.algorithm,
    CRYPTO.key,
    iv
  ) as DecipherGCM;

  decipher.setAuthTag(authTag); // ← проверяет целостность данных

   try {
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    // GCM автоматически бросает ошибку если authTag не совпадает
    // Это значит данные были изменены или ключ неверный
    throw new Error('Decryption failed: data may be tampered');
  }
}


