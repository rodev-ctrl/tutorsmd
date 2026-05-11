import { AccessTokenPayload } from '../../../domain/value-objects/AccessToken';

export interface IAccessTokenFactory {
  generate(payload: AccessTokenPayload): string;
  verify(token: string): AccessTokenPayload | null;
}