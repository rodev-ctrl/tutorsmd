import { IEmailVerificationRepository } from "../../../../domain/repositories/IEmailVerificationRepository";
import { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import { IEmailService } from "../../../ports/IEmailService";
import { IUnitOfWork } from "../../../ports/IUnitOfWork";
import { IUUIDGenerator } from "../../../ports/IUUIDGenerator";
import { IRefreshTokenFactory } from "../../../ports/token/IRefreshTokenFactory";

export class ResendVerificationUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailVerificationRepo: IEmailVerificationRepository,
    private readonly emailService: IEmailService,
    private readonly idGenerator: IUUIDGenerator,
    private readonly unitOfWork: IUnitOfWork,
    private readonly refreshTokenFactory: IRefreshTokenFactory
  ) {}

  async execute(email: string): Promise<void> {
    // 1. Найти юзера — тихий возврат защищает от email enumeration
    const user = await this.userRepo.findByEmail(email);
    if (!user) return;

    // 2. Уже активирован — не нужно отправлять
    if (user.isEmailVerified) return;

    // 3. Генерация нового токена
    const tokenHash = this.refreshTokenFactory.generate();
    // 4. Upsert — заменяет старый токен новым атомарно
    await this.unitOfWork.run(async () => {
      await this.emailVerificationRepo.upsert({
        userId: user.id,
        link: tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    });


    const link = `${process.env.CLIENT_URL}/activate/${rawToken}`;
    await this.emailService.sendActivationLink(user.email, link, user.languageCode);
  }
}