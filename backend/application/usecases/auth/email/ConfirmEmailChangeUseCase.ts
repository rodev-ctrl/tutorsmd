import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { IEmailChangeRepository } from '../../../../domain/repositories/email/IEmailChangeRepository';
import { DomainError } from '../../../../domain/errors/DomainError';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { ConflictError } from '../../../../domain/errors/ConflictError';
import { IEmailChangeTokenFactory } from '../../../ports/email/IEmailChangeTokenFactory';
import { IUnitOfWork } from '../../../ports/IUnitOfWork';

export class ConfirmEmailChangeUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailChangeRepo: IEmailChangeRepository,
    private readonly tokenFactory: IEmailChangeTokenFactory,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const link = this.tokenFactory.hashRaw(rawToken);

    await this.unitOfWork.run(async () => {
      const record = await this.emailChangeRepo.consumeToken(link);   // НАЙДЕНА и УДАЛЕНА лишняя запись
      if (!record) throw new DomainError('Invalid or expired link');

      
    if (record.expiresAt < new Date()) {
      await this.emailChangeRepo.deleteByUserId(record.userId);
      throw new DomainError('Link expired. Please request email change again.');
    }
      

    const user = await this.userRepo.findById(record.userId);
    if (!user) throw new NotFoundError('User not found');

    const taken = await this.userRepo.existsByEmail(record.newEmail);
    if (taken) {
      await this.emailChangeRepo.deleteByUserId(record.userId);
      throw new ConflictError('Email already taken. Please request email change again.');
    }

      const updatedUser = user.changeEmail(record.newEmail);
try {
 await this.userRepo.save(updatedUser);
}
  catch (err: any) {
        if (err?.code === 'P2002') {
          throw new ConflictError('Email already taken. Please request email change again.');
        }
        throw err;
      }
});
  }
}