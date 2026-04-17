// application/usecases/auth/LogoutUseCase.ts

import { ITokenService } from '../../ports/ITokenService';

type Role = 'client' | 'tutor';

export class LogoutUseCase {
  constructor(
    private readonly tokenService: ITokenService
  ) {}

  async execute(refreshToken: string, role: Role): Promise<boolean> {
    await this.tokenService.removeToken(refreshToken, role);
    return true;
  }
}