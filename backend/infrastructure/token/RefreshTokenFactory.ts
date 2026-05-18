import { IRefreshTokenFactory } from '../../application/ports/token/IRefreshTokenFactory';
import { ISecureTokenFactory } from '../../application/ports/token/ISecureTokenFactory';
import { RefreshToken } from '../../domain/value-objects/RefreshToken';
import { DomainError } from '../../domain/errors/DomainError';

export class RefreshTokenFactory implements IRefreshTokenFactory {
  constructor(
    private readonly tokenFactory: ISecureTokenFactory,
  ) {}

  generate(): RefreshToken {
    const { raw, hash } = this.tokenFactory.generateRefreshToken();
    return RefreshToken.fromParts(raw, hash);
  }

  fromRaw(raw: string): RefreshToken {
    if (!raw || raw.trim().length === 0) {
      throw new DomainError('Refresh token cannot be empty');
    }
    const hash = this.tokenFactory.hashRaw(raw);
    return RefreshToken.fromParts(raw, hash);
  }
}