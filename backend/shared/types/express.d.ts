import { AccessTokenPayload } from '../domain/value-objects/AccessToken';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export {};