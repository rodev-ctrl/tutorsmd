import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../../domain/repositories/IRefreshTokenRepository';
import { IPasswordResetRepository } from '../../../../domain/repositories/IPasswordResetRepository';
import { IPasswordHasher } from '../../../ports/IPasswordHasher';
import { ISecureTokenFactory } from '../../../ports/token/ISecureTokenFactory';
import { Password } from '../../../../domain/value-objects/Password';
import { DomainError } from '../../../../domain/errors/DomainError';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { IRefreshTokenFactory } from '../../../ports/token/IRefreshTokenFactory';

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly passwordResetRepo: IPasswordResetRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenFactory: ISecureTokenFactory,
  ) {}

  async execute(rawToken: string, newPassword: string): Promise<void> {
    // 1. Валидация нового пароля
    Password.validate(newPassword);

    // 2. Хэш для поиска в БД
    const tokenHash = this.tokenFactory.hashRaw(rawToken);

    // 3. Найти запись
    const record = await this.passwordResetRepo.findByLink(tokenHash);
    if (!record) throw new DomainError('Invalid or expired reset link');

    // 4. Проверить срок действия
    if (record.expiresAt < new Date()) {
      await this.passwordResetRepo.deleteByUserId(record.userId);
      throw new DomainError('Reset link expired. Please request a new one.');
    }

    // 5. Найти юзера
    const user = await this.userRepo.findById(record.userId);
    if (!user) throw new NotFoundError('User not found');

    // 6. Хэшировать и сохранить новый пароль
    const newHash = await this.passwordHasher.hash(newPassword);
    const updatedUser = user.setHashedPassword(newHash);
    await this.userRepo.save(updatedUser);

    // 7. Инвалидировать все сессии
    await this.refreshTokenRepo.revokeAllByUserId(record.userId);

    // 8. Удалить использованный токен
    await this.passwordResetRepo.deleteByUserId(record.userId);
  }
}