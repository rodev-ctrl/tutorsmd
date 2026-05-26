export type LessonStatus =
  | 'pending'
  | 'pending_reschedule'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_client'
  | 'cancelled_by_tutor'
  | 'rescheduled'
  | 'no_show_client'
  | 'no_show_tutor';

export type LessonType = 'trial' | 'regular';

export interface Lesson {
  id:                  string;
  clientId:            string;
  tutorId:             string;
  subjectId:           string;
  type:                LessonType;
  status:              LessonStatus;
  scheduledAt:         string;
  durationMinutes:     number;
  cancellationReason:  string | null;
  proposedScheduledAt: string | null;
  proposedExpiresAt:   string | null;
  startedAt:           string | null;
  completedAt:         string | null;
  createdAt:           string;
  tutor?:   { name: string; surname: string; avatarUrl: string | null };
  client?:  { name: string; surname: string; avatarUrl: string | null };
}

