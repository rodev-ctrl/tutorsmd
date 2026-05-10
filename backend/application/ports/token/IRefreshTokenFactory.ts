import { RefreshToken } from '../../../domain/value-objects/RefreshToken';

export interface IRefreshTokenFactory {
  generate(): RefreshToken;
  fromRaw(raw: string): RefreshToken;
}