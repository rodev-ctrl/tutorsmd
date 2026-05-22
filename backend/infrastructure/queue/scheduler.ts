import { Queue } from 'bullmq';
import { bullmqConnection } from './bullmq.connection';
import { JobNames } from './job-names';

const QUEUE_NAME = 'lesson-jobs';

export const lessonQueue = new Queue(QUEUE_NAME, {
  connection: bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: 100, // хранить последние 100 выполненных
    removeOnFail: 200, // хранить последние 200 упавших для дебага
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5_000,
    },
  },
});

export const startScheduler = async (): Promise<void> => {
  // Удаляем старые repeatable jobs перед регистрацией — избегаем дублей
  const existing = await lessonQueue.getRepeatableJobs();
  await Promise.all(existing.map(job => lessonQueue.removeRepeatableByKey(job.key)));

  // Каждую минуту — автозавершение уроков
  await lessonQueue.add(
    JobNames.AUTO_COMPLETE_LESSONS,
    {},
    { repeat: { pattern: '* * * * *' } },
  );

  // Каждые 5 минут — автоотмена pending уроков старше 24ч
  await lessonQueue.add(
    JobNames.AUTO_CANCEL_PENDING,
    {},
    { repeat: { pattern: '*/5 * * * *' } },
  );

  // Каждые 5 минут — истечение предложений о переносе
  await lessonQueue.add(
    JobNames.AUTO_EXPIRE_RESCHEDULE,
    {},
    { repeat: { pattern: '*/5 * * * *' } },
  );

  // Каждые 15 минут — напоминания о предстоящих уроках
  await lessonQueue.add(
    JobNames.SEND_LESSON_REMINDERS,
    {},
    { repeat: { pattern: '*/15 * * * *' } },
  );

  console.log('[Scheduler] Все задачи зарегистрированы.');
};