import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IAccessTokenService } from '../../../ports/IAccessTokenService';
import { AccessToken } from '../../../../domain/value-objects/AccessToken';
import { DomainError } from '../../../../domain/errors/DomainError';
import { Role } from '../../../../domain/entities/User';

export interface SwitchRoleResult {
  accessToken: string;
}

export class SwitchRoleUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly accessTokenService: IAccessTokenService,
  ) {}

  async execute(userId: string, newRole: Role): Promise<SwitchRoleResult> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new DomainError('User not found');

    // Проверяем что роль есть у юзера
    if (!user.hasRole(newRole)) {
      throw new DomainError(`User does not have role: ${newRole}`);
    }

    // Выдаём новый access token с новой ролью
    // Refresh token НЕ меняется — как на листе
    const accessTokenVO = AccessToken.create({
      userId: user.id,
      activeRole: newRole,
    });

    const accessToken = this.accessTokenService.generateAccessToken(
      accessTokenVO.payload
    );

    return { accessToken };
  }
}