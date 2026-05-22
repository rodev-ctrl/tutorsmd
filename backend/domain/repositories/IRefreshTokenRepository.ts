// domain/repositories/IRefreshTokenRepository.ts

export interface CreateRefreshTokenDto {
  userId: string;
  tokenHash: string;
  deviceInfo: string | null;
  expiresAt: Date;
}

export interface RefreshTokenRecord {
  userId: string;
  tokenHash: string;
  deviceInfo: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date; // ← добавь — нужен для "вошёл N дней назад" на странице сессий
}

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenDto): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  findActiveByUserId(userId: string): Promise<RefreshTokenRecord[]>;
  revoke(tokenHash: string): Promise<boolean>;
  revokeAllByUserId(userId: string): Promise<void>;
}