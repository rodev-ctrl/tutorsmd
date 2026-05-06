import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../../domain/repositories/IRefreshTokenRepository';
import { IPasswordHasher } from '../../../ports/IPasswordHasher';
import { Password } from '../../../../domain/value-objects/Password';
import { DomainError } from '../../../../domain/errors/DomainError';

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // 1. Найти юзера
    const user = await this.userRepo.findById(userId);
    if (!user) throw new DomainError('User not found');

    // 2. OAuth юзер не может менять пароль
    if (user.isOAuthUser()) {
      throw new DomainError('OAuth users cannot change password');
    }

    // 3. Проверить старый пароль
    const isValid = await this.passwordHasher.compare(oldPassword, user.hashedPassword!);
    if (!isValid) throw new DomainError('Incorrect old password');

    // 4. Валидация нового пароля
    Password.validate(newPassword);

    // 5. Хэшировать и сохранить
    const newHash = await this.passwordHasher.hash(newPassword);
    const updatedUser = user.setHashedPassword(newHash);
    await this.userRepo.save(updatedUser);

    // 6. Разлогинить со всех устройств — безопасность
    await this.refreshTokenRepo.revokeAllByUserId(userId);
  }
}