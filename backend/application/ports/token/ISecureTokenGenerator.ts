export interface SecureToken {
  raw: string;
  hash: string;
}

export interface ISecureTokenGenerator {
  generate(): SecureToken;
  hashRaw(raw: string): string;
}