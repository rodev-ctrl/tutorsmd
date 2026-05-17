// application/usecases/auth/activation/ResendVerificationUseCase.ts

import { IEmailVerificationRepository } from "../../../../domain/repositories/email/IEmailVerificationRepository";
import { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import { IEmailService } from "../../../ports/IEmailService";
import { IUnitOfWork } from "../../../ports/IUnitOfWork";
import { IEmailVerificationTokenFactory } from "../../../ports/email/IEmailVerificationTokenFactory";

export class ResendVerificationUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailVerificationRepo: IEmailVerificationRepository,
    private readonly emailService: IEmailService,
    private readonly unitOfWork: IUnitOfWork,
    private readonly verificationTokenFactory: IEmailVerificationTokenFactory,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return; // защита от email enumeration
    if (user.isEmailVerified) return;

    const token = this.verificationTokenFactory.generateVerificationToken();

    await this.unitOfWork.run(async () => {
      await this.emailVerificationRepo.upsert({
        userId: user.id,
        link: token.hash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    });

    const link = `${process.env.CLIENT_URL}/activate/${token.raw}`;
    await this.emailService.sendActivationLink(user.email, link, user.languageCode);
  }
}