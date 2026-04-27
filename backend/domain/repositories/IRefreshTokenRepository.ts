// domain/repositories/IRefreshTokenRepository.ts

export interface CreateRefreshTokenDto {
  userId: string;
  tokenHash: string;
  deviceInfo: string | null;
  expiresAt: Date;
}

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenDto): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<{
    userId: string;
    tokenHash: string;
    deviceInfo: string | null;
    expiresAt: Date;
    revokedAt: Date | null;
  } | null>;
  revoke(tokenHash: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}