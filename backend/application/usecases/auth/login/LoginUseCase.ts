import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../../domain/repositories/IRefreshTokenRepository';
import { IPasswordHasher } from '../../../ports/IPasswordHasher';
import { IAccessTokenFactory } from '../../../ports/token/IAccessTokenFactory';
import { DomainError } from '../../../../domain/errors/DomainError';

import { AccessToken } from '../../../../domain/value-objects/AccessToken';
import { IRefreshTokenFactory } from '../../../ports/token/IRefreshTokenFactory';
import { LoginDto, LoginResult } from '../../../dto/auth/LoginDto';


export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly accessTokenFactory: IAccessTokenFactory,
    private readonly refreshTokenFactory: IRefreshTokenFactory
  ) {}

  async execute(dto: LoginDto): Promise<LoginResult> {
    // 1. Найти юзера
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw new DomainError('Invalid email or password');

    // 2. Проверить пароль
    if (!user.hashedPassword) {
      throw new DomainError('This account uses OAuth. Please login with Google.');
    }
    const isValid = await this.passwordHasher.compare(dto.password, user.hashedPassword);
    if (!isValid) throw new DomainError('Invalid email or password');

    // 3. Проверить верификацию email
    if (!user.isEmailVerified) {
      throw new DomainError('Please verify your email before logging in');
    }

    // 4. Проверить роль
    if (!user.hasRole(dto.activeRole)) {
      throw new DomainError(`User does not have role: ${dto.activeRole}`);
    }

    const accessTokenV0 = AccessToken.create({ userId: user.id, activeRole: dto.activeRole });
    const accessToken = this.accessTokenFactory.generate(accessTokenV0);
    const refreshToken = this.refreshTokenFactory.generate();

    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: refreshToken.hash,
      deviceInfo: dto.deviceInfo ?? null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken: refreshToken.raw,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        activeRole: dto.activeRole,
      },
    };
  }
}