import { EventEmitter } from 'events';

export const appEvents = new EventEmitter();

export const AppEvents = {
  LESSON_COMPLETED: 'lesson.completed',
} as const;