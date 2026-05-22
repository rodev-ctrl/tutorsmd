import { NotFoundError } from "../../../../domain/errors/NotFoundError";
import { IRefreshTokenRepository } from "../../../../domain/repositories/IRefreshTokenRepository";
import { IUserRepository } from "../../../../domain/repositories/IUserRepository";

export class RevokeAllSessionsUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: string): Promise<void> {
     const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    await this.refreshTokenRepo.revokeAllByUserId(userId);
  }
}