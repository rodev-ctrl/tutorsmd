import { ISecureTokenFactory } from '../../application/ports/token/ISecureTokenFactory';
import { IEmailVerificationTokenFactory, EmailVerificationToken } from '../../application/ports/email/IEmailVerificationTokenFactory';
import { IPasswordResetTokenFactory, PasswordResetToken } from '../../application/ports/email/IPasswordResetTokenFactory';
import { IEmailChangeTokenFactory, EmailChangeToken } from '../../application/ports/email/IEmailChangeTokenFactory';
import { RefreshToken } from '../../domain/value-objects/RefreshToken';
import { IRefreshTokenFactory } from '../../application/ports/token/IRefreshTokenFactory';

export class SecureTokenFactory
  implements
    IEmailVerificationTokenFactory,
    IPasswordResetTokenFactory,
    IEmailChangeTokenFactory,
    IRefreshTokenFactory
{
  constructor(
    private readonly tokenGenerator: ISecureTokenFactory,
  ) {}

generateRefreshToken(): RefreshToken {
  return this.tokenGenerator.generateRefreshToken(); // то же что и остальные методы
}

  generateVerificationToken(): EmailVerificationToken {
    return this.tokenGenerator.generateVerificationToken();
  }

  generatePasswordResetToken(): PasswordResetToken {
    return this.tokenGenerator.generatePasswordResetToken();
  }

  generateEmailChangeToken(): EmailChangeToken {
    return this.tokenGenerator.generateEmailChangeToken();
  }

  hashRaw(raw: string): string {
    return this.tokenGenerator.hashRaw(raw);
  }
}