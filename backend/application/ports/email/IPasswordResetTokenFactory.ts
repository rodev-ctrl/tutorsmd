export interface PasswordResetToken {
  raw: string;   // в письмо
  hash: string;  // в БД
}

export interface IPasswordResetTokenFactory {
  generatePasswordResetToken(): PasswordResetToken;
  hashRaw(raw: string): string;
}