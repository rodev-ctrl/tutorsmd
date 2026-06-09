// application/usecases/auth/password/ChangePasswordUseCase.ts
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../../domain/repositories/IRefreshTokenRepository';
import { IPasswordHasher } from '../../../ports/IPasswordHasher';
import { Password } from '../../../../domain/value-objects/Password';
import { DomainError } from '../../../../domain/errors/DomainError';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { IUnitOfWork } from '../../../ports/IUnitOfWork';

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (user.isOAuthUser()) {
      throw new DomainError('OAuth users cannot change password');
    }

    const isValid = await this.passwordHasher.compare(oldPassword, user.hashedPassword!);
    if (!isValid) throw new DomainError('Incorrect old password');

    Password.validate(newPassword);

    const newHash = await this.passwordHasher.hash(newPassword);
    const updatedUser = user.setHashedPassword(newHash);

    await this.unitOfWork.run(async () => {
      await this.userRepo.save(updatedUser);

      // Разлогинить со всех устройств — пароль изменился
      await this.refreshTokenRepo.revokeAllByUserId(userId);
    });
  }
}