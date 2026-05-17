export interface EmailVerificationToken {
  raw: string;   // в письмо
  hash: string;  // в БД
}

export interface IEmailVerificationTokenFactory {
  generateVerificationToken(): EmailVerificationToken;
  hashRaw(raw: string): string; // при верификации входящего токена
}