// application/usecases/auth/RefreshTokenUseCase.ts

import { IUserRepository } from '../../../domain/repositories/InterfaceUserRepository';
import { ITokenService } from '../../ports/ITokenService';
import ApiError from '../../../domain/errors/apiError';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService
  ) {}

  async execute(
    refreshToken: string
  ): Promise<{
    accessToken: string;
    user: any;
    role: string;
  }> {
    if (!refreshToken) throw ApiError.Unauthorized('No refresh token');

    const payload = this.tokenService.validateRefreshToken(refreshToken);
    if (!payload) throw ApiError.Unauthorized('Invalid refresh token');

    const role = payload.role as 'client' | 'tutor';
    const tokenDoc = await this.tokenService.findToken(refreshToken, role);
    if (!tokenDoc) throw ApiError.Unauthorized('Session not found');

    const user = await this.userRepo.findById(payload.userId, payload.role as 'client' | 'tutor');
    if (!user) throw ApiError.NotFound('User not found');

    const { accessToken } = await this.tokenService.generateTokens({
      userId: Number(user.id),
      email: user.email,
      role: user.role
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname
      },
      role: user.role
    };
  }
}