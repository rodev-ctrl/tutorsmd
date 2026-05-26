import { ITutorRepository } from '../../../domain/repositories/ITutorRepository';
import { NotFoundError }    from '../../../domain/errors/NotFoundError';

export class GetTutorByUserIdUseCase {
  constructor(private readonly tutorRepo: ITutorRepository) {}

  async execute(userId: string): Promise<string> {
    const tutor = await this.tutorRepo.findByUserId(userId);
    if (!tutor) throw new NotFoundError('Tutor profile not found');
    return tutor.id; // возвращаем только tutorId
  }
}