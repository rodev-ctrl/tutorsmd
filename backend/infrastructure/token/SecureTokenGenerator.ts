// infrastructure/token/SecureTokenGenerator.ts

import crypto from 'crypto';
import { ISecureTokenGenerator, SecureToken } from '../../application/ports/token/ISecureTokenFactory';

export class SecureTokenGenerator implements ISecureTokenGenerator {
  generate(): SecureToken {
    const raw  = crypto.randomBytes(32).toString('hex'); // 64 символа
    const hash = this.hashRaw(raw);
    return { raw, hash };
  }

  hashRaw(raw: string): string {
    return crypto
      .createHash('sha256')
      .update(raw)
      .digest('hex');
  }
}