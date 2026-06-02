import { Router } from 'express';

import { requireAuth } from '../middlewares/auth/requireAuth';
import { requireRole } from '../middlewares/auth/requireRole';
import { validate } from '../middlewares/validate';

import {
  CreateQuizSchema,
  AddQuizQuestionSchema,
  AssignQuizToLessonSchema,
  StartQuizAttemptSchema,
  SubmitQuizAttemptSchema,
  ProvideAnswerFeedbackSchema,
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
    (req, res) => controller.createQuiz(req as any, res),
  );

  // POST /quizzes/:quizId/questions
  // Tutor adds question to quiz
  router.post(
    '/:quizId/questions',
    requireAuth,
    requireRole('tutor'),
    quizCreateLimiter,
    validate(AddQuizQuestionSchema),
    (req, res) => controller.addQuestion(req as any, res),
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
    (req, res) => controller.assignToLesson(req as any, res),
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
    (req, res) => controller.startAttempt(req as any, res),
  );

  // POST /quizzes/attempts/:attemptId/submit
  // Client submits attempt
  router.post(
    '/attempts/:attemptId/submit',
    requireAuth,
    requireRole('client'),
    quizSubmitLimiter,
    validate(SubmitQuizAttemptSchema),
    (req, res) => controller.submitAttempt(req as any, res),
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
    (req, res) => controller.provideAnswerFeedback(req as any, res),
  );

  return router;
};