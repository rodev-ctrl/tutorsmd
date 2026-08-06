
import { Worker, Job, ConnectionOptions } from 'bullmq';
import { bullmqConnection } from './bullmq.connection';
import { JobNames } from './job-names';
import { AutoCompleteLessonsJob }  from './jobs/lesson/AutoCompleteLessonsJob';
import { AutoCancelPendingJob }    from './jobs/lesson/AutoCancelPendingJob';
import { AutoExpireRescheduleJob } from './jobs/AutoExpireRescheduleJob';
import { SendLessonRemindersJob }  from './jobs/lesson/SendLessonRemindersJob';
import { GenerateLessonSummaryJob } from './jobs/lesson/GenerateLessonSummaryJob';

interface WorkerDeps {
  autoCompleteLesson:   AutoCompleteLessonsJob;
  autoCancelPending:    AutoCancelPendingJob;
  autoExpireReschedule: AutoExpireRescheduleJob;
  sendLessonReminders:  SendLessonRemindersJob;
  generateLessonSummary: GenerateLessonSummaryJob
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
        case JobNames.GENERATE_LESSON_SUMMARY:
          await deps.generateLessonSummary.run(job.data);
          break;

        default:
          console.warn(`[Worker] Неизвестная задача: ${job.name}`);
      }
    },
    {
      connection: bullmqConnection as ConnectionOptions,
      concurrency: 1,
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