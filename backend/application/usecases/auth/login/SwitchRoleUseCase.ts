import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IClientRepository } from '../../../../domain/repositories/IClientRepository';
import { ITutorRepository } from '../../../../domain/repositories/ITutorRepository';
import { IAccessTokenFactory } from '../../../ports/token/IAccessTokenFactory';
import { AccessToken } from '../../../../domain/value-objects/AccessToken';
import { DomainError } from '../../../../domain/errors/DomainError';
import { Role } from '../../../../domain/entities/User';

export interface SwitchRoleResult {
  accessToken: string;
}

export class SwitchRoleUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly accessTokenFactory: IAccessTokenFactory,
    private readonly clientRepo: IClientRepository,
    private readonly tutorRepo: ITutorRepository,
  ) {}

  async execute(userId: string, newRole: Role): Promise<SwitchRoleResult> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new DomainError('User not found');

    if (!user.hasRole(newRole)) {
      throw new DomainError(`User does not have role: ${newRole}`);
    }

    const profileId = await this.resolveProfileId(userId, newRole);

    const accessTokenV0 = AccessToken.create({
      userId: user.id,
      activeRole: newRole,
      profileId,
    });
    const accessToken = this.accessTokenFactory.generate(accessTokenV0);

    return { accessToken };
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