import { Request, Response } from 'express';
import { IProfileController } from './IProfileController';
import { GetUserProfileUseCase } from '../../../application/usecases/profile/GetUserProfileUseCase';
import { UpdateUserProfileDto, UpdateUserProfileUseCase } from '../../../application/usecases/profile/UpdateUserProfileUseCase';
import { LanguageCode } from '../../../domain/entities/User';

export class ProfileController implements IProfileController {
  constructor(
    private readonly getProfileUseCase:    GetUserProfileUseCase,
    private readonly updateProfileUseCase: UpdateUserProfileUseCase,
  ) {}

  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const profile = await this.getProfileUseCase.execute(userId);

    res.status(200).json({ profile });
  }

  async updateProfile(req: Request<{}, {}, UpdateUserProfileDto>, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { name, surname, username, timezone, languageCode, avatarUrl } = req.body;

    const result = await this.updateProfileUseCase.execute({
      userId,
      name,
      surname,
      username,
      timezone,
      languageCode: languageCode as LanguageCode | undefined,
      avatarUrl,
    });

    res.status(200).json({ profile: result });
  }
}