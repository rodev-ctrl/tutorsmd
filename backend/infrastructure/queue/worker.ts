
import { Worker, Job } from 'bullmq';
import { bullmqConnection } from './bullmq.connection';
import { JobNames } from './job-names';
import { AutoCompleteLessonsJob }  from './jobs/AutoCompleteLessonsJob';
import { AutoCancelPendingJob }    from './jobs/AutoCancelPendingJob';
import { AutoExpireRescheduleJob } from './jobs/AutoExpireRescheduleJob';
import { SendLessonRemindersJob }  from './jobs/SendLessonRemindersJob';

interface WorkerDeps {
  autoCompleteLesson:   AutoCompleteLessonsJob;
  autoCancelPending:    AutoCancelPendingJob;
  autoExpireReschedule: AutoExpireRescheduleJob;
  sendLessonReminders:  SendLessonRemindersJob;
}

export const createWorker = (deps: WorkerDeps): Worker => {
  const worker = new Worker(
    'lesson-jobs',
    async (job: Job) => {
      switch (job.name) {
        case JobNames.AUTO_COMPLETE_LESSONS:
          await deps.autoCompleteLesson.run();
          break;

        case JobNames.AUTO_CANCEL_PENDING:
          await deps.autoCancelPending.run();
          break;

        case JobNames.AUTO_EXPIRE_RESCHEDULE:
          await deps.autoExpireReschedule.run();
          break;

        case JobNames.SEND_LESSON_REMINDERS:
          await deps.sendLessonReminders.run();
          break;

        default:
          console.warn(`[Worker] Неизвестная задача: ${job.name}`);
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 1, // задачи выполняются последовательно — нет конкурентных проблем
    },
  );

  worker.on('completed', (job) =>
    console.log(`[Worker] Задача ${job.name} выполнена.`)
  );

  worker.on('failed', (job, err) =>
    console.error(`[Worker] Задача ${job?.name} упала:`, err.message)
  );

  return worker;
};