// application/usecases/auth/LoginUseCase.ts

import { IUserRepository } from '../../../domain/repositories/InterfaceUserRepository';
import { ITokenService } from '../../ports/ITokenService';
import { ITokenRepository } from '../../../domain/repositories/ITokenRepository';
import { IPasswordHasher } from '../../ports/IPasswordHasher';
import ApiError from '../../../domain/errors/apiError';

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly tokenRepo: ITokenRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    deviceId: string;
    user: any;
  }> {
    const user = await this.userRepo.findByEmail(email, role);
    if (!user) throw ApiError.NotFound('User not found');

    const isValid = await this.passwordHasher.compare(password, user.hashedPassword);
    if (!isValid) throw ApiError.Unauthorized('Incorrect password');

    if (!user.isActivated) {
      throw ApiError.Unauthorized('Account not activated');
    }

    // 1. Генерируем токены (ITokenService)
    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // 2. Сохраняем refresh token в БД (ITokenRepository)
    await this.tokenRepo.save(
      user.id,
      tokens.refreshToken,
      tokens.deviceId,
      user.role
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      deviceId: tokens.deviceId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role
      }
    };
  }
}