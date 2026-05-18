import { RefreshToken } from '../../../domain/value-objects/RefreshToken';

export interface IRefreshTokenFactory {
  generateRefreshToken(): RefreshToken;
  fromRaw(raw: string): RefreshToken;
}