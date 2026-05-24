import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IClientRepository } from '../../../domain/repositories/IClientRepository';
import { ITutorRepository } from '../../../domain/repositories/ITutorRepository';
import { NotFoundError } from '../../../domain/errors/NotFoundError';
import { ConflictError } from '../../../domain/errors/ConflictError';
import { LanguageCode } from '../../../domain/entities/User';

export interface UpdateUserProfileDto {
  userId: string;
  name?: string;
  surname?: string;
  username?: string;
  timezone?: string;
  languageCode?: LanguageCode;
  avatarUrl?: string | null;
}

export interface UpdateUserProfileResult {
  id: string;
  name: string;
  surname: string;
  username: string;
  timezone: string;
  languageCode: LanguageCode;
  avatarUrl: string | null;
}

export class UpdateUserProfileUseCase {
  constructor(
    private readonly userRepo: IUserRepository
  ) {}

  async execute(dto: UpdateUserProfileDto): Promise<UpdateUserProfileResult> {
  const user = await this.userRepo.findById(dto.userId);
  if (!user) throw new NotFoundError('User not found');

  if (dto.username && dto.username !== user.username) {
    const taken = await this.userRepo.existsByUsername(dto.username);
    if (taken) throw new ConflictError('Username already taken');
  }

  const updatedUser = user.update({
    name: dto.name,
    surname: dto.surname,
    username: dto.username,
    timezone: dto.timezone,
    languageCode: dto.languageCode,
    avatarUrl: dto.avatarUrl,
  });

  await this.userRepo.save(updatedUser);

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    surname: updatedUser.surname,
    username: updatedUser.username,
    timezone: updatedUser.timezone,
    languageCode: updatedUser.languageCode,
    avatarUrl: updatedUser.avatarUrl,
  };
}
}