export interface SecureToken {
  raw: string;
  hash: string;
}

export interface ISecureTokenFactory {
  generateVerificationToken(): SecureToken
  generatePasswordResetToken(): SecureToken
  generateEmailChangeToken(): SecureToken
  hashRaw(raw: string): string;
}