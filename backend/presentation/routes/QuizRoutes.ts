import { Router } from 'express';

import { requireAuth } from '../middlewares/auth/requireAuth';
import { requireRole } from '../middlewares/auth/requireRole';
import { validate } from '../middlewares/validate';
import { wrap } from './wrapper';

import {
  CreateQuizSchema,
  AddQuizQuestionSchema,
  AssignQuizToLessonSchema,
  StartQuizAttemptSchema,
  SubmitQuizAttemptSchema,
  ProvideAnswerFeedbackSchema,
  QuizQuestionParams,
  LessonIdParams,
  QuizIdParams,
  AttemptIdParams,
} from '../controllers/quiz/quiz.schema';

import { QuizController } from '../controllers/quiz/QuizController';
import { quizCreateLimiter, quizAttemptLimiter, quizSubmitLimiter } from '../middlewares/rateLimiter';

export const createQuizRouter = (
  controller: QuizController,
): Router => {
  const router = Router();


  // POST /quizzes
  // Tutor creates quiz
  router.post(
    '/',
    requireAuth,
    requireRole('tutor'),
    quizCreateLimiter,
    validate(CreateQuizSchema),
    wrap((req, res) => controller.createQuiz(req, res)),
  );

  // POST /quizzes/:quizId/questions
  // Tutor adds question to quiz
  router.post(
    '/:quizId/questions',
    requireAuth,
    requireRole('tutor'),
    quizCreateLimiter,
    validate(AddQuizQuestionSchema),
    wrap<QuizQuestionParams>((req, res) => controller.addQuestion(req, res)),
  );

  // ───────────────────────────────────────────────────────────
  // Lesson quiz assignment
  // ───────────────────────────────────────────────────────────

  // POST /lessons/:lessonId/quizzes
  // Tutor assigns existing quiz to lesson
  router.post(
    '/lessons/:lessonId/quizzes',
    requireAuth,
    requireRole('tutor'),
    quizCreateLimiter,
    validate(AssignQuizToLessonSchema),
    wrap<LessonIdParams, {}, { quizId: string }>((req, res) => controller.assignToLesson(req, res)),
  );

  // ───────────────────────────────────────────────────────────
  // Quiz attempts
  // ───────────────────────────────────────────────────────────

  // POST /quizzes/:quizId/attempts
  // Client starts attempt
  router.post(
    '/:quizId/attempts',
    requireAuth,
    requireRole('client'),
    quizAttemptLimiter,
    validate(StartQuizAttemptSchema),
    wrap<QuizIdParams, {}, { lessonId?: string | null }>((req, res) => controller.startAttempt(req, res)),
  );

  // POST /quizzes/attempts/:attemptId/submit
  // Client submits attempt
  router.post(
    '/attempts/:attemptId/submit',
    requireAuth,
    requireRole('client'),
    quizSubmitLimiter,
    validate(SubmitQuizAttemptSchema),
    wrap<AttemptIdParams, {}, { answers: { questionId: string; answer?: string | null; selectedOptions?: string[] }[] }>((req, res) => controller.submitAttempt(req, res)),
  );

  // ───────────────────────────────────────────────────────────
  // Tutor feedback
  // ───────────────────────────────────────────────────────────

  // POST /quizzes/attempts/:attemptId/feedback
  // Tutor reviews answer
  router.post(
    '/attempts/:attemptId/feedback',
    requireAuth,
    requireRole('tutor'),
    quizCreateLimiter,
    validate(ProvideAnswerFeedbackSchema),
    wrap<AttemptIdParams, {}, { answerId: string; comment?: string | null; isCorrect?: boolean | null; earnedPoints?: number | null }>((req, res) => controller.provideAnswerFeedback(req, res)),
  );

  return router;
};