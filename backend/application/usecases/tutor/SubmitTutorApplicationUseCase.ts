import { ITutorRepository } from '../../../domain/repositories/ITutorRepository';
import { NotFoundError } from '../../../domain/errors/NotFoundError';
import { DomainError } from '../../../domain/errors/DomainError';

export class SubmitTutorApplicationUseCase {
  constructor(private readonly tutorRepo: ITutorRepository) {}

  async execute(userId: string): Promise<void> {
    const tutor = await this.tutorRepo.findByUserId(userId);
    if (!tutor) throw new NotFoundError('Tutor not found');

    if (!tutor.hourlyRate) {
      throw new DomainError('Please set your hourly rate before submitting');
    }
    if (!tutor.highlightDe && !tutor.highlightRu) {
      throw new DomainError('Please add a short introduction before submitting');
    }

    const submitted = tutor.submit();
    await this.tutorRepo.save(submitted);
  }
}