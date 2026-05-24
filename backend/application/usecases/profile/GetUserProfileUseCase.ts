import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IClientRepository } from '../../../domain/repositories/IClientRepository';
import { ITutorRepository } from '../../../domain/repositories/ITutorRepository';
import { NotFoundError } from '../../../domain/errors/NotFoundError';
import { Role, LanguageCode } from '../../../domain/entities/User';

export interface UserProfileResult {
  id: string;
  name: string;
  surname: string;
  fullName: string;
  avatarUrl: string | null;
  username: string;
  email: string;
  roles: ReadonlyArray<Role>;
  isEmailVerified: boolean;
  authProvider: string;
  timezone: string;
  languageCode: LanguageCode;
  // Профиль клиента (если есть)
  client: {
    id: string;
  } | null;
  // Профиль тьютора (если есть)
  tutor: {
    id: string;
    approvalStatus: string;
    ratingAvg: number;
    ratingCount: number;
    hourlyRate: number | null;
  } | null;
}

export class GetUserProfileUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly clientRepo: IClientRepository,
    private readonly tutorRepo: ITutorRepository,
  ) {}

  async execute(userId: string): Promise<UserProfileResult> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    // Загружаем профили параллельно
    const [client, tutor] = await Promise.all([
      user.hasRole('client') ? this.clientRepo.findByUserId(userId) : null,
      user.hasRole('tutor') ? this.tutorRepo.findByUserId(userId) : null,
    ]);

    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      username: user.username,
      email: user.email,
      roles: user.roles,
      isEmailVerified: user.isEmailVerified,
      authProvider: user.authProvider,
      timezone: user.timezone,
      languageCode: user.languageCode,
      client: client ? {
        id: client.id,
      } : null,
      tutor: tutor ? {
        id: tutor.id,
        approvalStatus: tutor.approvalStatus,
        ratingAvg: tutor.ratingAvg,
        ratingCount: tutor.ratingCount,
        hourlyRate: tutor.hourlyRate,
      } : null,
    };
  }
}