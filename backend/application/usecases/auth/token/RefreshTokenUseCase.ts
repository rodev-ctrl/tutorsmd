import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../../domain/repositories/IRefreshTokenRepository';
import { IClientRepository } from '../../../../domain/repositories/IClientRepository';
import { ITutorRepository } from '../../../../domain/repositories/ITutorRepository';
import { IAccessTokenFactory } from '../../../ports/token/IAccessTokenFactory';
import { DomainError } from '../../../../domain/errors/DomainError';
import { Role } from '../../../../domain/entities/User';
import { AccessToken } from '../../../../domain/value-objects/AccessToken';
import { IRefreshTokenFactory } from '../../../ports/token/IRefreshTokenFactory';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly accessTokenFactory: IAccessTokenFactory,
    private readonly refreshTokenFactory: IRefreshTokenFactory,
    private readonly clientRepo: IClientRepository,
    private readonly tutorRepo: ITutorRepository,
  ) {}

  async execute(rawToken: string, activeRole?: Role): Promise<RefreshResult> {
    const incomingToken = this.refreshTokenFactory.fromRaw(rawToken);
    const record = await this.refreshTokenRepo.findByTokenHash(incomingToken.hash);

    if (!record) throw new DomainError('Session not found');

    if (record.revokedAt) {
      await this.refreshTokenRepo.revokeAllByUserId(record.userId);
      throw new DomainError('Token reuse detected. All sessions revoked.');
    }
    if (record.expiresAt < new Date()) throw new DomainError('Session expired');

    const user = await this.userRepo.findById(record.userId);
    if (!user) throw new DomainError('User not found');

    const resolvedRole: Role = activeRole ?? user.roles[0];

    if (!user.hasRole(resolvedRole)) {
      throw new DomainError(`User does not have role: ${resolvedRole}`);
    }

    await this.refreshTokenRepo.revoke(incomingToken.hash);

    const newToken = this.refreshTokenFactory.generate();
    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: newToken.hash,
      deviceInfo: record.deviceInfo,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const profileId = await this.resolveProfileId(user.id, resolvedRole);

    const accessTokenV0 = AccessToken.create({
      userId: user.id,
      activeRole: resolvedRole,
      profileId,
    });
    const accessToken = this.accessTokenFactory.generate(accessTokenV0);

    return { accessToken, refreshToken: newToken.raw };
  }

  private async resolveProfileId(userId: string, role: string): Promise<string> {
    if (role === 'client') {
      const client = await this.clientRepo.findByUserId(userId);
      return client?.id ?? userId;
    }
    if (role === 'tutor') {
      const tutor = await this.tutorRepo.findByUserId(userId);
      return tutor?.id ?? userId;
    }
    return userId;
  }
}