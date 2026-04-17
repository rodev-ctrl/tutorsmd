// application/usecases/auth/ActivateAccountUseCase.ts

import { IUserRepository } from '../../../domain/repositories/InterfaceUserRepository';

export class ActivateAccountUseCase {
  constructor(
    private readonly userRepo: IUserRepository
  ) {}

  async execute(activationLink: string): Promise<void> {
    // 1. Найти пользователя по ссылке
    const user = await this.userRepo.findByActivationLink(activationLink);
    
    if (!user) {
      throw new Error('Invalid activation link');
    }

    // 2. Активировать (domain logic)
    user.activate();

    // 3. Сохранить изменения
    await this.userRepo.save(user);
  }
}