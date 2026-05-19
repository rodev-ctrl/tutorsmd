// application/usecases/auth/password/ForgotPasswordUseCase.ts
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IPasswordResetRepository } from '../../../../domain/repositories/IPasswordResetRepository';
import { IEmailService } from '../../../ports/IEmailService';
import { IPasswordResetTokenFactory } from '../../../ports/email/IPasswordResetTokenFactory';

export interface ForgotPasswordDto {
  email: string;
}

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordResetRepo: IPasswordResetRepository,
    private readonly emailService: IEmailService,
    private readonly tokenFactory: IPasswordResetTokenFactory,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    // Тихий возврат — защита от email enumeration
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) return;
    if (user.isOAuthUser()) return;

    const { raw, hash } = this.tokenFactory.generatePasswordResetToken();

    await this.passwordResetRepo.upsert({
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 минут
    });

    const link = `${process.env.CLIENT_URL}/password/reset/${raw}`;
    await this.emailService.sendPasswordResetLink(dto.email, link, user.languageCode);
  }
}