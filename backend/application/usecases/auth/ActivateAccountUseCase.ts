import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEmailVerificationRepository } from '../../../domain/repositories/IEmailVerificationRepository';
import { DomainError } from '../../../domain/errors/DomainError';

export class ActivateAccountUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailVerificationRepo: IEmailVerificationRepository,
  ) {}

  async execute(token: string): Promise<void> {
    // 1. Найти запись верификации по токену
    const verification = await this.emailVerificationRepo.findByLink(token);
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

    // 6. Сохранить
    await this.userRepo.save(activatedUser);

    // 7. Удалить токен — он больше не нужен
    await this.emailVerificationRepo.deleteByUserId(verification.userId);
  }
}