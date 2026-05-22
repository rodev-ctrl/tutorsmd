import { IRefreshTokenRepository } from '../../../../domain/repositories/IRefreshTokenRepository';
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
    
    const revoked = await this.refreshTokenRepo.revoke(token);
    if (!revoked) {
      // Токен уже был использован — признак кражи
      await this.refreshTokenRepo.revokeAllByUserId(record.userId);
      throw new DomainError('Token reuse detected. All sessions revoked.');
    }
  }
}