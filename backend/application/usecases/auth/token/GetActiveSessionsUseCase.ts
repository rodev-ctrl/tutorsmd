import { IRefreshTokenRepository } from "../../../../domain/repositories/IRefreshTokenRepository";


export interface SessionDto {
  tokenHash: string;
  deviceInfo: string | null;
  createdAt: Date;
  expiresAt: Date;
}


export class GetActiveSessionsUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(userId: string): Promise<SessionDto[]> {
    const sessions = await this.refreshTokenRepo.findActiveByUserId(userId);
    return sessions.map(s => ({
      tokenHash: s.tokenHash,
      deviceInfo: s.deviceInfo,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }
}