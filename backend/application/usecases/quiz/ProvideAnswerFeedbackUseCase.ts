import { IQuizAttemptRepository } from '../../../domain/repositories/quiz/IQuizAttemptRepository';
import { IQuizAnswerFeedbackRepository } from '../../../domain/repositories/quiz/IQuizAnswerFeedbackRepository';
import { IQuizAnswerRepository } from '../../../domain/repositories/quiz/IQuizAnswerRepository';
import { IUUIDGenerator } from '../../ports/IUUIDGenerator';
import { IUnitOfWork } from '../../ports/IUnitOfWork';
import { TutorId } from '../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../domain/errors/NotFoundError';
import { DomainError } from '../../../domain/errors/DomainError';

export interface ProvideAnswerFeedbackDto {
  answerId: string;
  attemptId: string;
  tutorId: string;
  comment?: string | null;
  isCorrect?: boolean | null;
  earnedPoints?: number | null;
}

export class ProvideAnswerFeedbackUseCase {
  constructor(
    private readonly attemptRepo: IQuizAttemptRepository,
    private readonly feedbackRepo: IQuizAnswerFeedbackRepository,
    private readonly answerRepo: IQuizAnswerRepository,
    private readonly idGenerator: IUUIDGenerator,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: ProvideAnswerFeedbackDto): Promise<void> {
    const tutorId = new TutorId(dto.tutorId);

    const attempt = await this.attemptRepo.findById(dto.attemptId);
    if (!attempt) throw new NotFoundError('Quiz attempt not found');

    if (!attempt.isSubmitted) {
      throw new DomainError('Cannot provide feedback for non-submitted attempt');
    }

    if ((dto.earnedPoints ?? 0) < 0) {
      throw new DomainError('Earned points cannot be negative');
    }

    await this.unitOfWork.run(async () => {
      // 1. feedback → QuizAnswerFeedback
      const exists = await this.feedbackRepo.existsByAnswer(dto.answerId);
      if (exists) {
        await this.feedbackRepo.save({
          answerId: dto.answerId,
          comment: dto.comment ?? null,
          isCorrect: dto.isCorrect ?? null
        });
      } else {
        await this.feedbackRepo.create({
          id: this.idGenerator.generate(),
          answerId: dto.answerId,
          tutorId: tutorId.value,
          comment: dto.comment ?? null,
          isCorrect: dto.isCorrect ?? null,
        });
      }

      // 2. earnedPoints → QuizAnswer
      await this.answerRepo.updateEarnedPoints(dto.answerId, dto.earnedPoints ?? null);

      // 3. Пересчёт totalPoints → QuizAttempt
      const totalPoints = await this.answerRepo.getTotalEarnedPoints(dto.attemptId);
      await this.attemptRepo.save(attempt.updateTotalPoints(totalPoints));
    });
  }
}