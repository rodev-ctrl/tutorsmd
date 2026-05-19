import crypto from 'crypto';
import { IRefreshTokenFactory } from '../../application/ports/token/IRefreshTokenFactory';
import { RefreshToken } from '../../domain/value-objects/RefreshToken';
import { DomainError } from '../../domain/errors/DomainError';

export class RefreshTokenFactory implements IRefreshTokenFactory {

   generate(): RefreshToken {
    const raw  = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return RefreshToken.fromParts(raw, hash);
  }

  fromRaw(raw: string): RefreshToken {
    if (!raw || raw.trim().length === 0) {
      throw new DomainError('Refresh token cannot be empty');
    }
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return RefreshToken.fromParts(raw, hash);
  }
}