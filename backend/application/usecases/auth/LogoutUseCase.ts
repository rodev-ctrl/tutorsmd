import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { RefreshToken } from '../../../domain/value-objects/RefreshToken';
import { DomainError } from '../../../domain/errors/DomainError';

export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const token = RefreshToken.fromRaw(rawToken); // валидирует + хэширует
    const record = await this.refreshTokenRepo.findByTokenHash(token.hash);
    if (!record) throw new DomainError('Session not found');
    await this.refreshTokenRepo.revoke(token.hash);
  }
}