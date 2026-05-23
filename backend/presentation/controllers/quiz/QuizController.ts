import { Request, Response } from 'express';

import { IQuizController } from './IQuizController';

import { CreateQuizUseCase } from '../../../application/usecases/quiz/CreateQuizUseCase';
import { AddQuizQuestionUseCase } from '../../../application/usecases/quiz/AddQuizQuetionUseCase';
import { AssignQuizToLessonUseCase } from '../../../application/usecases/quiz/AssignQuizToLessonUseCase';
import { StartQuizAttemptUseCase } from '../../../application/usecases/quiz/StartQuizAttemptUseCase';
import { SubmitQuizAttemptUseCase } from '../../../application/usecases/quiz/SubmitQuizAttemptUsecase';
import { ProvideAnswerFeedbackUseCase } from '../../../application/usecases/quiz/ProvideAnswerFeedbackUseCase';

import {
  CreateQuizDto,
  AddQuizQuestionDto,
  AssignQuizToLessonDto,
  StartQuizAttemptDto,
  SubmitQuizAttemptDto,
  ProvideAnswerFeedbackDto,
} from './quiz.schema';

type QuizIdParams = {
  quizId: string;
};

type LessonIdParams = {
  lessonId: string;
};

type AttemptIdParams = {
  attemptId: string;
};

type QuizQuestionParams = {
  quizId: string;
};

export class QuizController implements IQuizController {
  constructor(
    private readonly createQuizUseCase: CreateQuizUseCase,
    private readonly addQuestionUseCase: AddQuizQuestionUseCase,
    private readonly assignToLessonUseCase: AssignQuizToLessonUseCase,
    private readonly startAttemptUseCase: StartQuizAttemptUseCase,
    private readonly submitAttemptUseCase: SubmitQuizAttemptUseCase,
    private readonly provideAnswerFeedbackUseCase: ProvideAnswerFeedbackUseCase,
  ) {}

  // POST /quizzes
  async createQuiz(
    req: Request<{}, {}, CreateQuizDto>,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.profileId;

    const result = await this.createQuizUseCase.execute({
      tutorId,
      ...req.body,
    });

    res.status(201).json({
      quizId: result.quizId,
    });
  }

  // POST /quizzes/:quizId/questions
  async addQuestion(
    req: Request<QuizQuestionParams, {}, AddQuizQuestionDto>,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.profileId;
    const { quizId } = req.params;

    const result = await this.addQuestionUseCase.execute({
      quizId,
      tutorId,
      ...req.body,
    });

    res.status(201).json({
      questionId: result.questionId,
      order: result.order,
    });
  }

  // POST /lessons/:lessonId/quizzes
  async assignToLesson(
    req: Request<LessonIdParams, {}, AssignQuizToLessonDto>,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.profileId;
    const { lessonId } = req.params;

    await this.assignToLessonUseCase.execute({
      tutorId,
      lessonId,
      ...req.body,
    });

    res.status(201).json({
      message: 'Quiz assigned to lesson.',
    });
  }

  // POST /quizzes/:quizId/attempts
  async startAttempt(
    req: Request<QuizIdParams, {}, StartQuizAttemptDto>,
    res: Response,
  ): Promise<void> {
    const clientId = req.user!.profileId;
    const { quizId } = req.params;

    const result = await this.startAttemptUseCase.execute({
      quizId,
      clientId,
      ...req.body,
    });

    res.status(201).json({
      attemptId: result.attemptId,
      startedAt: result.startedAt,
    });
  }

  // POST /quizzes/attempts/:attemptId/submit
  async submitAttempt(
    req: Request<AttemptIdParams, {}, SubmitQuizAttemptDto>,
    res: Response,
  ): Promise<void> {
    const clientId = req.user!.profileId;
    const { attemptId } = req.params;

    await this.submitAttemptUseCase.execute({
      attemptId,
      clientId,
      ...req.body,
    });

    res.status(200).json({
      message: 'Quiz submitted.',
    });
  }

  // POST /quizzes/attempts/:attemptId/feedback
  async provideAnswerFeedback(
  req: Request<AttemptIdParams, {}, ProvideAnswerFeedbackDto>,
  res: Response,
): Promise<void> {
  const tutorId = req.user!.profileId;
  const { attemptId } = req.params;

  const {
    answerId,
    comment,
    isCorrect,
    earnedPoints,
  } = req.body;

  await this.provideAnswerFeedbackUseCase.execute({
    attemptId,
    tutorId,
    answerId,
    comment,
    isCorrect,
    earnedPoints,
  });

  res.status(200).json({
    message: 'Feedback provided.',
  });
}
}