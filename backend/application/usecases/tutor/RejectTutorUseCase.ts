import { ITutorRepository } from '../../../domain/repositories/ITutorRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEmailService } from '../../ports/IEmailService';
import { NotFoundError } from '../../../domain/errors/NotFoundError';

export interface RejectTutorDto {
  tutorId: string;
  reason?: string; 
}

export class RejectTutorUseCase {
  constructor(
    private readonly tutorRepo: ITutorRepository,
    private readonly userRepo: IUserRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(dto: RejectTutorDto): Promise<void> {
    // 1. Найти тьютора
    const tutor = await this.tutorRepo.findById(dto.tutorId);
    if (!tutor) throw new NotFoundError('Tutor not found');

    // 2. Reject через domain method — бросит DomainError если уже rejected
    const rejected = tutor.reject();
    await this.tutorRepo.save(rejected);

    // 3. Уведомить тьютора — вне транзакции
    const user = await this.userRepo.findById(tutor.userId);
    if (user) {
      await this.emailService.sendTutorRejected(user.email, user.languageCode);
    }
  }
}