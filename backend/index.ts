import 'dotenv/config';
import 'express-async-errors';


import express from 'express';
import type { Request } from 'express';
import type { IncomingMessage, ServerResponse } from "http";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { rateLimit } from "express-rate-limit";



// import { GastController } from './presentation/controllers/gastController';

// Routes
// import GastRouter from './presentation/routes/GastRoutes';
// import AdminRouter from './presentation/routes/AdminRoutes';
// import UserRouter from './presentation/routes/UserRoutes';
// import UsersChatRouter from './presentation/routes/UsersChatRoutes';
// import FileRouter from './presentation/routes/FileRoutes';
import { createAuthRouter }         from './presentation/routes/AuthRoutes';
import { createProfileRouter }      from './presentation/routes/ProfileRoutes';
import { createTutorRouter }        from './presentation/routes/tutor/TutorRoutes';
import { createTutorPublicRouter }  from './presentation/routes/tutor/TutorPublicRoutes';
import { createLessonRouter }       from './presentation/routes/LessonRoutes';
import { createAvailableSlotRouter } from './presentation/routes/AvailableSlotRoutes';
import { createReviewRouter }       from './presentation/routes/ReviewRoutes';
import { createQuizRouter }         from './presentation/routes/QuizRoutes';
import { createAppealRouter }       from './presentation/routes/AppealRoutes';
import { createFeedbackRouter }     from './presentation/routes/FeedbackRoutes';

import {
  authController,
  profileController,
  tutorController,
  tutorPublicController,
  lessonController,
  availableSlotController,
  reviewController,
  quizController,
  appealController,
  feedbackController,
} from './di/container';


import { appEvents, AppEvents } from './infrastructure/events/AppEventEmitter';


import { errorMiddleware } from './presentation/middlewares/errorMiddleware';

import { accessTokenFactory, autoCompleteLesson, completeLessonUseCase, fileStorage, getSupportChatHistoryUseCase, joinSupportChatUseCase, prisma, sendSupportMessageUseCase,  autoCancelPending,
  autoExpireReschedule,
  sendLessonReminders } from './di/container';
import { createSocketServer } from './infrastructure/websocket/createSocketServer';
import { connectRedis } from './infrastructure/redis/redisClient';
import { createWorker } from './infrastructure/queue/worker';
import { startScheduler } from './infrastructure/queue/scheduler';

// Перенеси ЭТО наверх файла, до async function bootstrap():
declare module 'express-serve-static-core' {
  interface Request {
    rawBody?: Buffer;
  }
}


async function bootstrap() {

// ============================
//   REDIS ИНИЦИАЛИЗАЦИЯ
// ============================
try {
  await connectRedis();
} catch (e) {
  console.error("Redis failed, starting without it");
}


// Запускаем воркер
const worker = createWorker({
  autoCompleteLesson,
  autoCancelPending,
  autoExpireReschedule,
  sendLessonReminders,
});

await startScheduler();




const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL, 
  credentials: true,             
}));
app.use(cookieParser());


app.use(express.json({
  limit: "10mb",
  verify: (
    req: IncomingMessage & { rawBody?: Buffer },
    _res: ServerResponse,
    buf: Buffer,
    _encoding: string
  ) => {
    (req as Request).rawBody = buf;
  }
}));


app.use(express.urlencoded({ extended: true, limit: "10mb" })); // For parsing URL-encoded requests

///////////// CRUD ////////////////
app.use('/api/auth',    createAuthRouter(authController));
app.use('/api/profile', createProfileRouter(profileController));
app.use('/api/tutor',   createTutorRouter(tutorController));
app.use('/api/tutors',  createTutorPublicRouter(tutorPublicController));
app.use('/api/lessons', createLessonRouter(lessonController));
app.use('/api/slots',   createAvailableSlotRouter(availableSlotController));
app.use('/api/reviews', createReviewRouter(reviewController));
app.use('/api/quiz',    createQuizRouter(quizController));
app.use('/api/appeals', createAppealRouter(appealController));
app.use('/api/feedback', createFeedbackRouter(feedbackController));
///////////////////////////////////

///////////// HEALTH ///////////////////////////////////////////////////////////
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
/////////////////////////////////////////////////////////////////////////////////

// Статика
// app.use(express.static(path.join(__dirname, 'public')));
// const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "questionFiles");
// fs.mkdirSync(UPLOAD_DIR, { recursive: true });  
// app.use("/api/qf", express.static(UPLOAD_DIR));

// Подключение обработчика ошибок
app.use(errorMiddleware);



const httpServer = http.createServer(app);
const io = createSocketServer({
  httpServer,
  prisma,
  fileStorage,
  tokenService:       accessTokenFactory,
  joinSupportChat:    joinSupportChatUseCase,
  sendSupportMessage: sendSupportMessageUseCase,
  getSupportChatHistory:  getSupportChatHistoryUseCase,
  completeLessonUseCase: completeLessonUseCase
});

appEvents.on(AppEvents.LESSON_COMPLETED, (lessonId: string) => {
  io.to(lessonId).emit('meetingEnded');
});

app.use("/socket.io", rateLimit({
  windowMs: 60_000,
  max: 20, // 20 подключений в минуту с одного IP
}));


/*
// Запуск очистки каждое воскресенье в полночь
cron.schedule('0 0 * * 0', () => {
  GastController.cleanOldGuestData();
});
*/


const shutdown = async (signal: string) => {
  console.log(`[Server] ${signal} terminated`);
  await worker.close();
  httpServer.close();
  process.exit(0);
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT',  () => shutdown('SIGINT'));



try {
  
  httpServer.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  }).on('error', (err: { message: any; }) => {
    console.error('Error occurred:', err.message);
  });
} catch (e) {
  console.log(e);
}
}
bootstrap().catch(err => {
  console.error('[Server] Критическая ошибка:', err);
  process.exit(1);
});