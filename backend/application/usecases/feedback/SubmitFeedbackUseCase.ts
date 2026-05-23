import { IUUIDGenerator } from '../../ports/IUUIDGenerator';
import { UserId } from '../../../domain/value-objects/EntityId';
import { DomainError } from '../../../domain/errors/DomainError';
import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { SubmitFeedbackDto } from '../../dto/feedback/SubmitFeedbackDto';

export class SubmitFeedbackUseCase {
  constructor(
    private readonly feedbackRepo: IFeedbackRepository,
    private readonly idGenerator:  IUUIDGenerator,
  ) {}

  async execute(dto: SubmitFeedbackDto): Promise<void> {
    const userId = new UserId(dto.userId);

    if (!dto.text || dto.text.trim().length === 0) {
      throw new DomainError('Feedback text cannot be empty');
    }

    if (dto.text.trim().length > 5000) {
      throw new DomainError('Feedback text is too long');
    }

    await this.feedbackRepo.create({
      id:     this.idGenerator.generate(),
      userId: userId.value,
      text:   dto.text.trim(),
    });
  }
}