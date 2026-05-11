import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../../domain/repositories/IRefreshTokenRepository';
import { IPasswordHasher } from '../../../ports/IPasswordHasher';
import { IAccessTokenService } from '../../../ports/token/IAccessTokenFactory';
import { DomainError } from '../../../../domain/errors/DomainError';
import { Role } from '../../../../domain/entities/User';
import { RefreshToken } from '../../../../domain/value-objects/RefreshToken';
import { AccessToken } from '../../../../domain/value-objects/AccessToken';
import { IRefreshTokenFactory } from '../../../ports/token/IRefreshTokenFactory';

export interface LoginDto {
  email: string;
  password: string;
  activeRole: Role;
  deviceInfo?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    surname: string;
    activeRole: Role;
  };
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly accessTokenService: IAccessTokenService,
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

    // 5. Access token через value object
    const accessTokenVO = AccessToken.create({
      userId: user.id,
      activeRole: dto.activeRole,
    });
    const accessToken = this.accessTokenService.generateAccessToken(accessTokenVO.payload);
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