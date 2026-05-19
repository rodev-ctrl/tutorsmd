import crypto from 'crypto';
import { IEmailVerificationTokenFactory, EmailVerificationToken } 
  from '../../application/ports/email/IEmailVerificationTokenFactory';
import { IEmailChangeTokenFactory, EmailChangeToken } 
  from '../../application/ports/email/IEmailChangeTokenFactory';
import { IPasswordResetTokenFactory, PasswordResetToken } 
  from '../../application/ports/email/IPasswordResetTokenFactory';

export class SecureTokenFactory 
  implements 
    IEmailVerificationTokenFactory, 
    IEmailChangeTokenFactory, 
    IPasswordResetTokenFactory 
{

   private generate(): { raw: string; hash: string } {
    const raw  = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return { raw, hash };
  }

  generateVerificationToken(): EmailVerificationToken {
    return this.generate();
  }

  generatePasswordResetToken(): PasswordResetToken {
    return this.generate();
  }

  generateEmailChangeToken(): EmailChangeToken {
    return this.generate();
  }

  hashRaw(raw: string): string {
    if (!raw || raw.trim().length === 0) {
      throw new Error('Token cannot be empty');
    }
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

}