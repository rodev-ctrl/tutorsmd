import { IRefreshTokenRepository } from "../../../../domain/repositories/IRefreshTokenRepository";

export class GetActiveSessionsUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(userId: string) {
    const sessions = await this.refreshTokenRepo.findActiveByUserId(userId);
    return sessions.map(s => ({
      tokenHash: s.tokenHash,
      deviceInfo: s.deviceInfo,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }
}