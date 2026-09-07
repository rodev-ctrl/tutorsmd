import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../../../domain/repositories/IRefreshTokenRepository';
import { IClientRepository } from '../../../../domain/repositories/IClientRepository';
import { ITutorRepository } from '../../../../domain/repositories/ITutorRepository';
import { IAccessTokenFactory } from '../../../ports/token/IAccessTokenFactory';
import { IRefreshTokenFactory } from '../../../ports/token/IRefreshTokenFactory';
import { IGoogleTokenVerifier } from '../../../ports/IGoogleTokenVerifier';
import { IProfileCreator } from '../../../ports/IProfileCreator';
import { IUUIDGenerator } from '../../../ports/IUUIDGenerator';
import { IUnitOfWork } from '../../../ports/IUnitOfWork';
import { AccessToken } from '../../../../domain/value-objects/AccessToken';
import { User } from '../../../../domain/entities/User';
import { DomainError } from '../../../../domain/errors/DomainError';

export interface GoogleAuthDto {
  idToken:    string;
  deviceInfo?: string;
}

export interface GoogleAuthResult {
  accessToken:  string;
  refreshToken: string;
  user: {
    id:         string;
    email:      string;
    name:       string;
    surname:    string;
    activeRole: string;
  };
}

/**
 * Ein Google-Sign-In-Endpunkt pro Rolle (client/tutor) — analog zu
 * RegisterUserUseCase, wo dieselbe Klasse mit unterschiedlichem
 * IProfileCreator für /register/client bzw. /register/tutor injiziert wird.
 * DI: googleAuthClientUseCase / googleAuthTutorUseCase, je mit eigenem profileCreator.
 */
export class GoogleAuthUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly googleVerifier: IGoogleTokenVerifier,
    private readonly profileCreator: IProfileCreator,
    private readonly idGenerator: IUUIDGenerator,
    private readonly unitOfWork: IUnitOfWork,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly accessTokenFactory: IAccessTokenFactory,
    private readonly refreshTokenFactory: IRefreshTokenFactory,
    private readonly clientRepo: IClientRepository,
    private readonly tutorRepo: ITutorRepository,
  ) {}

  async execute(dto: GoogleAuthDto): Promise<GoogleAuthResult> {
    const payload = await this.googleVerifier.verify(dto.idToken);
    const role = this.profileCreator.role;

    let user = await this.userRepo.findByOAuthProvider('google', payload.sub);

    if (!user) {
      const existing = await this.userRepo.findByEmail(payload.email);

      if (existing) {
        // Auto-Link nur wenn Google die E-Mail bestätigt hat — sonst könnte
        // irgendjemand mit einer fremden, unbestätigten E-Mail-Angabe versuchen,
        // sich an einen bestehenden Account zu hängen.
        if (!payload.emailVerified) {
          throw new DomainError('Google account email is not verified');
        }
        // Rolle muss schon existieren — automatisches Hinzufügen einer neuen
        // Rolle (z.B. Client → Tutor) ist ein eigener Flow, nicht Teil davon.
        if (!existing.hasRole(role)) {
          throw new DomainError(
            `An account with this email already exists without the '${role}' role. Log in normally first.`,
          );
        }
        await this.userRepo.linkOAuthProvider(existing.id, {
          provider:   'google',
          providerId: payload.sub,
          email:      payload.email,
        });
        user = existing;
      } else {
        if (!payload.emailVerified) {
          throw new DomainError('Google account email is not verified');
        }

        const userId    = this.idGenerator.generate();
        const profileId = this.idGenerator.generate();
        const username  = await this.generateUniqueUsername(
          payload.givenName ?? payload.name ?? 'user',
          payload.familyName ?? '',
        );

        const newUser = User.create({
          id: userId,
          name: payload.givenName ?? payload.name ?? 'Google',
          surname: payload.familyName ?? 'User',
          username,
          email: payload.email,
          passwordHash: null,
          authProvider: 'google',
          avatarUrl: payload.picture,
          roles: [role],
        });

        await this.unitOfWork.run(async () => {
          await this.userRepo.create(newUser, {
            provider:   'google',
            providerId: payload.sub,
            email:      payload.email,
          });
          await this.profileCreator.createProfile(userId, profileId);
        });

        user = newUser;
      }
    }

    if (!user.hasRole(role)) {
      throw new DomainError(`User does not have role: ${role}`);
    }

    const profileId = await this.resolveProfileId(user.id, role);

    const accessTokenV0 = AccessToken.create({
      userId: user.id,
      activeRole: role,
      profileId,
    });
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
        activeRole: role,
      },
    };
  }

  // Дублирует RegisterUserUseCase.generateUniqueUsername — небольшая, самодостаточная
  // утилита, не стоило тащить общий рефакторинг ради 8 строк.
  private async generateUniqueUsername(name: string, surname: string): Promise<string> {
    const base = `${name[0] ?? 'g'}${surname[0] ?? ''}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const candidate = `${base || 'g'}_${this.idGenerator.generate().slice(0, 6)}`;
    const taken = await this.userRepo.existsByUsername(candidate);
    if (taken) return this.generateUniqueUsername(name, surname);
    return candidate;
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
