import { type CipherKey, createSecretKey } from "node:crypto";

const keyHex = process.env.SECRET_KEY?.trim();
if (!keyHex || !/^[0-9a-fA-F]{64}$/.test(keyHex)) {
  throw new Error("SECRET_KEY must be 64 hex characters");
}

export const CRYPTO: { algorithm: string; key: CipherKey } = {
  algorithm: "aes-256-cbc",
  key: createSecretKey(keyHex, "hex") ,
};
