import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository';
import { IAccessTokenService } from '../../ports/IAccessTokenService';
import { DomainError } from '../../../domain/errors/DomainError';
import { Role } from '../../../domain/entities/User';
import { RefreshToken } from '../../../domain/value-objects/RefreshToken';
import { AccessToken } from '../../../domain/value-objects/AccessToken';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly accessTokenService: IAccessTokenService,
  ) {}

  async execute(rawToken: string, activeRole: Role): Promise<RefreshResult> {
    // 1. Хэшируем и ищем в БД
    const incomingToken = RefreshToken.fromRaw(rawToken);
    const record = await this.refreshTokenRepo.findByTokenHash(incomingToken.hash);

    if (!record) throw new DomainError('Session not found');
    if (record.revokedAt) {
      // Это признак кражи токена — кто-то использует старый токен
      // Разлогиниваем ВСЕ сессии этого юзера
      await this.refreshTokenRepo.revokeAllByUserId(record.userId);
      throw new DomainError('Token reuse detected. All sessions revoked.');
    }
    if (record.expiresAt < new Date()) throw new DomainError('Session expired');
    

    // 2. Найти юзера
    const user = await this.userRepo.findById(record.userId);
    if (!user) throw new DomainError('User not found');

    // 3. Проверить роль
    if (!user.hasRole(activeRole)) {
      throw new DomainError(`User does not have role: ${activeRole}`);
    }

    // 4. Rotation — отозвать старый, создать новый
    await this.refreshTokenRepo.revoke(incomingToken.hash);

    const newToken = RefreshToken.generate();
    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: newToken.hash,
      deviceInfo: record.deviceInfo,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // 5. Новый access token
    const accessTokenVO = AccessToken.create({ userId: user.id, activeRole });
    const accessToken = this.accessTokenService.generateAccessToken(accessTokenVO.payload);

    return {
      accessToken,
      refreshToken: newToken.raw,
    };
  }
}