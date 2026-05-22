import { AccessToken, AccessTokenPayload } from '../../../domain/value-objects/AccessToken';

export interface IAccessTokenFactory {
  generate(token: AccessToken): string;
  verify(token: string): AccessTokenPayload | null;
}