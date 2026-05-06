import { AccessTokenPayload } from '../../domain/value-objects/AccessToken';

export interface IAccessTokenService {
  generateAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): AccessTokenPayload | null;
}