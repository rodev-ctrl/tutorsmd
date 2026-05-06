import { DomainError } from '../errors/DomainError';
import { Role } from '../entities/User';

export interface AccessTokenPayload {
  userId: string;
  activeRole: Role;
}

export class AccessToken {
  private readonly _payload: AccessTokenPayload;

  private constructor(payload: AccessTokenPayload) {
    this._payload = payload;
  }

  static create(payload: AccessTokenPayload): AccessToken {
    if (!payload.userId) throw new DomainError('userId is required');
    if (!payload.activeRole) throw new DomainError('activeRole is required');
    return new AccessToken(payload);
  }

  get userId(): string { return this._payload.userId; }
  get activeRole(): Role { return this._payload.activeRole; }
  get payload(): AccessTokenPayload { return this._payload; }
}