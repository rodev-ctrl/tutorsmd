import { DomainError } from "../../../../domain/errors/DomainError";
import { NotFoundError } from "../../../../domain/errors/NotFoundError";
import { IRefreshTokenRepository } from "../../../../domain/repositories/IRefreshTokenRepository";

export class RevokeSessionUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(userId: string, tokenHash: string): Promise<void> {
    const session = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!session || session.userId !== userId) {
      throw new NotFoundError('Session not found');
    }

    if (session.revokedAt) {
      throw new DomainError('Session already revoked');
    }

    await this.refreshTokenRepo.revoke(tokenHash);
  }
}