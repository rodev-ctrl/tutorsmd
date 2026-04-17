// application/usecases/auth/ChangePasswordUseCase.ts

import { IUserRepository } from '../../../domain/repositories/InterfaceUserRepository';
import { ITokenService } from '../../ports/ITokenService';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import ApiError from '../../../domain/errors/apiError';

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(
    refreshToken: string,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // 1. Валидация токена
    const payload = this.tokenService.validateRefreshToken(refreshToken);
    if (!payload) throw ApiError.Unauthorized('Invalid token');

    // 2. Проверка сессии
    const role = payload.role as 'client' | 'tutor';
    const tokenDoc = await this.tokenService.findToken(refreshToken, role);
    if (!tokenDoc) throw ApiError.Forbidden('Session not found or expired');

    // 3. Найти пользователя
    const user = await this.userRepo.findById(payload.userId, role);
    if (!user) throw ApiError.NotFound('User not found');

    // 4. Проверить старый пароль (через port, не в domain entity)
    const isValid = await this.passwordHasher.compare(oldPassword, user.hashedPassword);
    if (!isValid) throw ApiError.Unauthorized('Incorrect old password');

    // 5. Хешировать новый пароль и обновить
    const newHash = await this.passwordHasher.hash(newPassword);
    user.setHashedPassword(newHash);

    // 6. Сохранить
    await this.userRepo.save(user);

    // 7. Разлогинить на всех устройствах
    const id: number = user.id as number; 
    await this.tokenService.logoutAllDevices(id, role);

    return true;
  }
}
