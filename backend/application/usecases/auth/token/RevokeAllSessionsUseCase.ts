import { IRefreshTokenRepository } from "../../../../domain/repositories/IRefreshTokenRepository";

export class RevokeAllSessionsUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllByUserId(userId);
  }
}