export interface EmailChangeToken {
  raw: string;   // в письмо
  hash: string;  // в БД
}

export interface IEmailChangeTokenFactory {
  generateEmailChangeToken(): EmailChangeToken;
  hashRaw(raw: string): string;
}