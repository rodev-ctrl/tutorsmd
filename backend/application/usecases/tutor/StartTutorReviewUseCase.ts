import { ITutorRepository } from '../../../domain/repositories/ITutorRepository';
import { NotFoundError } from '../../../domain/errors/NotFoundError';

export class StartTutorReviewUseCase {
  constructor(private readonly tutorRepo: ITutorRepository) {}

  async execute(tutorId: string): Promise<void> {
    const tutor = await this.tutorRepo.findById(tutorId);
    if (!tutor) throw new NotFoundError('Tutor not found');

    const underReview = tutor.startReview();
    await this.tutorRepo.save(underReview);
  }
}