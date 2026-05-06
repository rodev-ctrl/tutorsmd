// application/usecases/auth/email/ConfirmEmailChangeUseCase.ts
import crypto from 'crypto';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IEmailChangeRepository } from '../../../../domain/repositories/IEmailChangeRepository';
import { DomainError } from '../../../../domain/errors/DomainError';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { ConflictError } from '../../../../domain/errors/ConflictError';

export class ConfirmEmailChangeUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailChangeRepo: IEmailChangeRepository,
  ) {}

  async execute(rawToken: string): Promise<void> {
    // 1. SHA-256 хэш для поиска
    const link = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // 2. Найти запрос
    const record = await this.emailChangeRepo.findByLink(link);
    if (!record) throw new DomainError('Invalid or expired link');

    // 3. Проверить срок действия
    if (record.expiresAt < new Date()) {
      await this.emailChangeRepo.deleteByUserId(record.userId);
      throw new DomainError('Link expired. Please request email change again.');
    }

    // 4. Найти юзера
    const user = await this.userRepo.findById(record.userId);
    if (!user) throw new NotFoundError('User not found');

    // 5. Проверить что новый email всё ещё свободен
    const taken = await this.userRepo.existsByEmail(record.newEmail);
    if (taken) {
      await this.emailChangeRepo.deleteByUserId(record.userId);
      throw new ConflictError('Email already taken. Please request email change again.');
    }

    // 6. Обновить email через domain method
    const updatedUser = user.changeEmail(record.newEmail);
    await this.userRepo.save(updatedUser);

    // 7. Удалить использованный токен
    await this.emailChangeRepo.deleteByUserId(record.userId);
  }
}