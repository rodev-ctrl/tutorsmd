import { IRefreshTokenRepository } from '../../../../domain/repositories/IRefreshTokenRepository';
import { RefreshToken } from '../../../../domain/value-objects/RefreshToken';
import { DomainError } from '../../../../domain/errors/DomainError';
import { IRefreshTokenFactory } from '../../../ports/token/IRefreshTokenFactory';

export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly refreshTokenFactory: IRefreshTokenFactory
  ) {}

  async execute(rawToken: string): Promise<void> {
    const token = this.refreshTokenFactory.fromRaw(rawToken).hash;
    const record = await this.refreshTokenRepo.findByTokenHash(token);
    if (!record) throw new DomainError('Session not found');
    await this.refreshTokenRepo.revoke(token);
  }
}