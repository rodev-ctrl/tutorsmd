import { DomainError } from '../errors/DomainError';
import crypto from 'crypto';

export class RefreshToken {
  private readonly _raw: string;
  private readonly _hash: string;

  private constructor(raw: string, hash: string) {
    this._raw = raw;
    this._hash = hash;
  }

  static generate(): RefreshToken {
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return new RefreshToken(raw, hash);
  }

  static fromRaw(raw: string): RefreshToken {
    if (!raw || raw.trim().length === 0) {
      throw new DomainError('Refresh token cannot be empty');
    }
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return new RefreshToken(raw, hash);
  }

  get raw(): string { return this._raw; }
  get hash(): string { return this._hash; }
}