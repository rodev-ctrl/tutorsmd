export const JobNames = {
  AUTO_COMPLETE_LESSONS: 'auto-complete-lessons',
  AUTO_CANCEL_PENDING: 'auto-cancel-pending',
  AUTO_EXPIRE_RESCHEDULE: 'auto-expire-reschedule',
  SEND_LESSON_REMINDERS: 'send-lesson-reminders',
  GENERATE_NEXT_REGULAR: 'generate-next-regular-lesson',
} as const;

export type JobName = typeof JobNames[keyof typeof JobNames];