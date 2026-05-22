import jwt from 'jsonwebtoken';
import { IAccessTokenFactory } from '../../application/ports/token/IAccessTokenFactory';
import { AccessToken, AccessTokenPayload } from '../../domain/value-objects/AccessToken';

export class JwtAccessTokenFactory implements IAccessTokenFactory {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error('JWT_ACCESS_SECRET is required');
    this.secret = secret;
    this.expiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '900';
  }

  generate(token: AccessToken): string {
    return jwt.sign(token.payload, this.secret, { expiresIn: Number(this.expiresIn) });
  }

  verify(token: string): AccessTokenPayload | null {
    try {
      return jwt.verify(token, this.secret) as AccessTokenPayload;
    } catch {
      return null;
    }
  }
}