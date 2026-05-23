import { z } from 'zod';

export const CreateQuizSchema = z.object({
  title:     z.string().min(1).max(255),
  subjectId: z.string().uuid(),
  description: z.string().max(2000).nullable().optional(),
});

const QuizOptionSchema = z.object({
  text:      z.string().min(1).max(500),
  isCorrect: z.boolean(),
});

export const AddQuizQuestionSchema = z.object({
  question:  z.string().min(1).max(1000),
  type:      z.enum(['free_text', 'single_choice', 'multiple_choice']),
  maxPoints: z.number().int().min(1).optional(),
  options:   z.array(QuizOptionSchema).min(2).max(10).optional(),
});

export const AssignQuizToLessonSchema = z.object({
  quizId: z.string().uuid(),
});
 
// StartQuizAttemptUseCase: dto.quizId (route), dto.clientId (JWT), dto.lessonId?
export const StartQuizAttemptSchema = z.object({
  lessonId: z.string().uuid().nullable().optional(),
});

const SubmitAnswerSchema = z.object({
  questionId:      z.string().uuid(),
  answer:          z.string().optional().nullable(),      // free_text
  selectedOptions: z.array(z.string().uuid()).optional(),
});

export const SubmitQuizAttemptSchema = z.object({
  answers: z.array(SubmitAnswerSchema).min(1),
});

export const ProvideAnswerFeedbackSchema = z.object({
  answerId:     z.string().uuid(),
  comment:      z.string().max(1000).nullable().optional(),
  isCorrect:    z.boolean().nullable().optional(),
  earnedPoints: z.number().min(0).nullable().optional(),
});

export type CreateQuizDto            = z.infer<typeof CreateQuizSchema>;
export type AddQuizQuestionDto       = z.infer<typeof AddQuizQuestionSchema>;
export type AssignQuizToLessonDto    = z.infer<typeof AssignQuizToLessonSchema>;
export type StartQuizAttemptDto      = z.infer<typeof StartQuizAttemptSchema>;
export type SubmitQuizAttemptDto     = z.infer<typeof SubmitQuizAttemptSchema>;
export type ProvideAnswerFeedbackDto = z.infer<typeof ProvideAnswerFeedbackSchema>;