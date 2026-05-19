import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IEmailVerificationRepository } from '../../../../domain/repositories/email/IEmailVerificationRepository';
import { DomainError } from '../../../../domain/errors/DomainError';
import { IUnitOfWork } from '../../../ports/IUnitOfWork';
import { IEmailVerificationTokenFactory } from '../../../ports/email/IEmailVerificationTokenFactory';

export class ActivateAccountUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailVerificationRepo: IEmailVerificationRepository,
    private readonly unitOfWork: IUnitOfWork,
    private readonly tokenFactory: IEmailVerificationTokenFactory
  ) {}

  async execute(token: string): Promise<void> {
    // 1. Найти запись верификации по токену
    const tokenHash = this.tokenFactory.hashRaw(token); 
    const verification = await this.emailVerificationRepo.findByTokenHash(tokenHash);
    if (!verification) {
      throw new DomainError('Invalid activation link');
    }

    // 2. Проверить срок действия
    if (verification.expiresAt < new Date()) {
      await this.emailVerificationRepo.deleteByUserId(verification.userId);
      throw new DomainError('Activation link expired, please request a new one');
    }

    // 3. Найти юзера
    const user = await this.userRepo.findById(verification.userId);
    if (!user) throw new DomainError('User not found');

    // 4. Уже активирован?
    if (user.isEmailVerified) {
      throw new DomainError('Account already activated');
    }

    // 5. Активировать через domain method
    const activatedUser = user.verifyEmail();

    await this.unitOfWork.run(async () => {
      await this.userRepo.save(activatedUser);
      await this.emailVerificationRepo.deleteByUserId(verification.userId);
    });
  }
}