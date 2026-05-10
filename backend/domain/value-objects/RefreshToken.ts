import { DomainError } from "../errors/DomainError";


export class RefreshToken {
  private constructor(
    private readonly _raw: string,
    private readonly _hash: string,
  ) {}

  static fromParts(raw: string, hash: string): RefreshToken {
    if (!raw || raw.trim().length === 0) {
      throw new DomainError('Refresh token cannot be empty');
    }
    if (!hash || hash.trim().length === 0) {
      throw new DomainError('Token hash cannot be empty');
    }
    return new RefreshToken(raw, hash);
  }

  get raw(): string { return this._raw; }
  get hash(): string { return this._hash; }
}