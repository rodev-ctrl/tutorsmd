export interface UpsertEmailVerificationDto {
  userId: string;
  tokenHash: string;      // токен верификации (хранить хэш в БД для безопасности)
  expiresAt: Date;
}

export interface EmailVerificationRecord {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IEmailVerificationRepository {
  // upsert — создаёт или заменяет существующую запись (один активный токен на юзера)
  upsert(data: UpsertEmailVerificationDto): Promise<void>;

  // Поиск по токену — используется при активации аккаунта
  findByTokenHash(tokenHash: string): Promise<EmailVerificationRecord | null>;

  // Удаление после успешной верификации или при повторной отправке
  deleteByUserId(userId: string): Promise<void>;
}
