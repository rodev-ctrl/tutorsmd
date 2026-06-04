import { prisma } from '../infrastructure/database/prismaClient';

// ─── Repositories ─────────────────────────────────────────────
import { PrismaUserRepository }              from '../infrastructure/database/repositories/PrismaUserRepository';
import { PrismaClientRepository }            from '../infrastructure/database/repositories/PrismaClientRepository';
import { PrismaTutorRepository }             from '../infrastructure/database/repositories/PrismaTutorRepository';
import { PrismaRefreshTokenRepository }      from '../infrastructure/database/repositories/PrismaRefreshTokenRepository';
import { PrismaEmailVerificationRepository } from '../infrastructure/database/repositories/PrismaEmailVerificationRepository';
import { PrismaPasswordResetRepository }     from '../infrastructure/database/repositories/PrismaPasswordResetRepository';
import { PrismaEmailChangeRepository }       from '../infrastructure/database/repositories/PrismaEmailChangeRepository';
import { PrismaSupportChatRepository }       from '../infrastructure/database/repositories/PrismaSupportChatRepository';
import { PrismaLessonRepository }            from '../infrastructure/database/repositories/lesson/PrismaLessonRepository';
import { PrismaLessonMaterialRepository } from '../infrastructure/database/repositories/lesson/PrismaLessonMaterialRepository';


import { PrismaAppealRepository } from '../infrastructure/database/repositories/PrismaAppealRepository';
import { PrismaAvailableSlotRepository } from '../infrastructure/database/repositories/PrismaAvailableSlotRepository';

import { PrismaQuizRepository } from '../infrastructure/database/repositories/quiz/PrismaQuizRepository';
import { PrismaLessonQuizRepository } from '../infrastructure/database/repositories/quiz/PrismaLessonQuizRepository';
import { PrismaQuizAttemptRepository } from '../infrastructure/database/repositories/quiz/PrismaQuizAttemptRepository';
import { PrismaQuizQuestionRepository } from '../infrastructure/database/repositories/quiz/PrismaQuizQuestionRepository';
import { PrismaQuizAnswerFeedbackRepository } from '../infrastructure/database/repositories/quiz/PrismaQuizAnswerFeedbackRepository'; 
import { PrismaQuizAnswerRepository } from '../infrastructure/database/repositories/quiz/PrismaQuizAnswerRepository'; 

import { PrismaReviewRepository } from '../infrastructure/database/repositories/PrismaReviewRepository'; 





// ─── Services ─────────────────────────────────────────────────
import { NodemailerEmailService } from '../infrastructure/email/NodemailerEmailService';
import { UUIDGenerator }          from '../infrastructure/security/UUIDGenerator';
import { Argon2PasswordHasher }   from '../infrastructure/security/Argon2PasswordHasher';
import { PrismaUnitOfWork }       from '../infrastructure/database/PrismaUnitOfWork';
import { R2FileStorage }          from '../infrastructure/storage/R2FileStorage';

// ─── Token Infrastructure ─────────────────────────────────────
import { SecureTokenFactory }    from '../infrastructure/token/SecureTokenFactory';
import { RefreshTokenFactory }   from '../infrastructure/token/RefreshTokenFactory';
import { JwtAccessTokenFactory } from '../infrastructure/token/JwtAccessTokenFactory';

import { appEvents, AppEvents } from '../infrastructure/events/AppEventEmitter';


// ─── Profile Creators ─────────────────────────────────────────
import { ClientProfileCreator } from '../infrastructure/profile-creators/ClientProfileCreator';
import { TutorProfileCreator }  from '../infrastructure/profile-creators/TutorProfileCreator';

// ─── Use Cases: Auth ──────────────────────────────────────────
import { RegisterUserUseCase }       from '../application/usecases/auth/registration/RegisterUserUseCase';
import { ActivateAccountUseCase }    from '../application/usecases/auth/activation/ActivateAccountUseCase';
import { ResendVerificationUseCase } from '../application/usecases/auth/activation/ResendVerificationUseCase';
import { LoginUseCase }              from '../application/usecases/auth/login/LoginUseCase';
import { LogoutUseCase }             from '../application/usecases/auth/login/LogoutUseCase';
import { SwitchRoleUseCase }         from '../application/usecases/auth/login/SwitchRoleUseCase';
import { RefreshTokenUseCase }       from '../application/usecases/auth/token/RefreshTokenUseCase';
import { GetActiveSessionsUseCase }  from '../application/usecases/auth/token/GetActiveSessionsUseCase';
import { RevokeSessionUseCase }      from '../application/usecases/auth/token/RevokeSessionUseCase';
import { RevokeAllSessionsUseCase }  from '../application/usecases/auth/token/RevokeAllSessionsUseCase';
import { ChangePasswordUseCase }     from '../application/usecases/auth/password/ChangePasswordUseCase';
import { ForgotPasswordUseCase }     from '../application/usecases/auth/password/ForgotPasswordUseCase';
import { ResetPasswordUseCase }      from '../application/usecases/auth/password/ResetPasswordUseCase';
import { RequestEmailChangeUseCase } from '../application/usecases/auth/email/RequestEmailChangeUseCase';
import { ConfirmEmailChangeUseCase } from '../application/usecases/auth/email/ConfirmEmailChangeUseCase';

// --- Use Cases: Support --------------------------------------------------------------------------------------------- 
import { JoinSupportChatUseCase }    from '../application/usecases/support-chat/JoinSupportChatUseCase';
import { SendSupportChatMessageUseCase } from '../application/usecases/support-chat/SendSupportChatMessageUseCase';

// --- Use Cases: Lesson ---------------------------------------------------------------------------------------------
import { CompleteLessonUseCase } from '../application/usecases/lesson/CompleteLessonUseCase';
import { GetSupportChatHistoryUseCase } from '../application/usecases/support-chat/GetSupportChatHistoryUseCase';
import { AutoCompleteLessonsJob } from '../infrastructure/queue/jobs/AutoCompleteLessonsJob';
import { AutoCancelPendingJob } from '../infrastructure/queue/jobs/AutoCancelPendingJob';
import { AutoExpireRescheduleJob } from '../infrastructure/queue/jobs/AutoExpireRescheduleJob';
import { SendLessonRemindersJob } from '../infrastructure/queue/jobs/SendLessonRemindersJob';
import { GenerateNextRegularLessonUseCase } from '../application/usecases/lesson/regular/GenerateNextRegularScheduleUseCase';
import { PrismaRegularScheduleRepository } from '../infrastructure/database/repositories/lesson/PrismaRegularScheduleRepository';

import { RejectTutorUseCase } from '../application/usecases/tutor/RejectTutorUseCase';
import { ApproveTutorUseCase } from '../application/usecases/tutor/ApproveTutorUseCase';
import { GetPendingTutorsUseCase } from '../application/usecases/tutor/GetPendingTutorUseCase';
import { CancelLessonUseCase } from '../application/usecases/lesson/CancelLessonUseCase';
import { ConfirmLessonUseCase } from '../application/usecases/lesson/ConfirmLessonUseCase';
import { RejectLessonUseCase } from '../application/usecases/lesson/RejectLessonUseCase';
import { StartLessonUseCase } from '../application/usecases/lesson/StartLessonUseCase';
import { GetLessonMaterialUseCase } from '../application/usecases/lesson/material/GetLessonMaterialUseCase';
import { DeleteLessonMaterialUseCase } from '../application/usecases/lesson/material/DeleteLessonMaterialUseCase';
import { UploadLessonMaterialUseCase } from '../application/usecases/lesson/material/UploadLessonMaterialUseCase';
import { MarkNoShowClientUseCase } from '../application/usecases/lesson/no-show/MarkNoShowClientUseCase';
import { MarkNoShowTutorUseCase } from '../application/usecases/lesson/no-show/MarkNoShowTutorUseCase';
import { CancelRegularScheduleUseCase } from '../application/usecases/lesson/regular/CancelRegularScheduleUseCase';
import { CancelSingleLessonUseCase } from '../application/usecases/lesson/regular/CancelSingleLessonUseCase';
import { CreateRegularScheduleUseCase } from '../application/usecases/lesson/regular/CreateRegularScheduleUseCase';
import { AcceptRescheduleProposalUseCase } from '../application/usecases/lesson/reschedule/AcceptRescheduleProposalUseCase';
import { DeclineRescheduleProposalUseCase } from '../application/usecases/lesson/reschedule/DeclineRescheduleProposalUseCase';
import { ProposeLessonRescheduleUseCase } from '../application/usecases/lesson/reschedule/ProposeLessonRescheduleUseCase';
import { RescheduleLessonByClientUseCase } from '../application/usecases/lesson/reschedule/RescheduleLessonByClientUseCase';
import { CreateTrialLessonUseCase } from '../application/usecases/lesson/trial/CreateTrialLessonUseCase';
import { GetUserLessonUseCase } from '../application/usecases/lesson/GetUserLessonUseCase';
 
// Use Cases: Profile
import { GetUserProfileUseCase } from '../application/usecases/profile/GetUserProfileUseCase';
import { UpdateUserProfileUseCase } from '../application/usecases/profile/UpdateUserProfileUseCase'; 

//////////////// Controllers //////////////////////////////////////////////////////////////////////////////////////////////// 
import { AuthController } from '../presentation/controllers/auth/AuthController';
import { AppealController } from '../presentation/controllers/appeal/AppealController';
import { QuizController } from '../presentation/controllers/quiz/QuizController';
import { ReviewController } from '../presentation/controllers/review/ReviewController';
import { SupportChatController } from '../presentation/controllers/support-chat/SupportChatController';
import { LessonController } from '../presentation/controllers/lesson/LessonController';
import { AvailableSlotController } from '../presentation/controllers/available-slot/AvailableSlotController';
import { FeedbackController } from '../presentation/controllers/feedback/FeedbackController';
import { TutorController } from "../presentation/controllers/tutor/TutorController";
import { ProfileController } from '../presentation/controllers/profile/ProfileController';


import { CreateAvailableSlotUseCase } from '../application/usecases/available-slot/CreateAvailableSlotUseCase';
import { GetAppealsUseCase } from '../application/usecases/appeal/GetAppealUseCase';
import { RejectAppealUseCase } from '../application/usecases/appeal/RejectAppealUseCase';
import { ResolveAppealUseCase } from '../application/usecases/appeal/ResolveAppealUseCase';
import { DeleteAvailableSlotUseCase } from '../application/usecases/available-slot/DeleteAvailableUseCase';
import { GetTutorOwnSlotsUseCase } from '../application/usecases/available-slot/GetTutorOwnSlotsUseCase';
import { GetTutorPublicSlotsUseCase } from '../application/usecases/available-slot/GetTutorPublicSlotsUseCase';
import { GetTutorSlotsUseCase } from '../application/usecases/available-slot/GetTutorSlotsUseCase';
import { CreateAppealUseCase } from '../application/usecases/appeal/CreateAppealUseCase';
import { SubmitFeedbackUseCase } from '../application/usecases/feedback/SubmitFeedbackUseCase';
import { CreateQuizUseCase } from '../application/usecases/quiz/CreateQuizUseCase';
import { ProvideAnswerFeedbackUseCase } from '../application/usecases/quiz/ProvideAnswerFeedbackUseCase';
import { GetTutorReviewsUseCase } from '../application/usecases/reviews/GetTutorReviewsUseCase';
import { SubmitReviewUseCase } from '../application/usecases/reviews/SubmitReviewUseCase';
import { StartQuizAttemptUseCase } from '../application/usecases/quiz/StartQuizAttemptUseCase';
import { SubmitQuizAttemptUseCase } from '../application/usecases/quiz/SubmitQuizAttemptUsecase';
import { AssignQuizToLessonUseCase } from '../application/usecases/quiz/AssignQuizToLessonUseCase';
import { AddQuizQuestionUseCase } from '../application/usecases/quiz/AddQuizQuetionUseCase';
import { PrismaFeedbackRepository } from '../infrastructure/database/repositories/PrismaFeedbackRepository';
import { GetTutorPublicProfileUseCase } from '../application/usecases/tutor/public/GetTutorPublicProfileUseCase';
import { UpdateTutorProfileUseCase } from '../application/usecases/tutor/UpdateTutorProfileUseCase';
import { GetTutorByUserIdUseCase } from '../application/usecases/tutor/GetTutorByUserIdUseCase';
import { TutorPublicController } from '../presentation/controllers/tutor/public/TutorPublicController';
import { GetTutorPublicListUseCase } from '../application/usecases/tutor/public/GetTutorPublicListUseCase';
import { StartTutorReviewUseCase } from '../application/usecases/tutor/StartTutorReviewUseCase';
import { SubmitTutorApplicationUseCase } from '../application/usecases/tutor/SubmitTutorApplicationUseCase';
import { GetAllSupportChatsUseCase } from '../application/usecases/support-chat/GetAllSupportChatsUseCase';
import { GetSupportChatByIdUseCase } from '../application/usecases/support-chat/GetSupportChatByIdUseCase';
import { GetTutorOwnProfileUseCase } from '../application/usecases/tutor/GetTutorOwnProfileUseCase';
import { UpdateTutorSubjectsUseCase } from '../application/usecases/tutor/UpdateTutorSubjectsUseCase';


// ─── Token Infrastructure ─────────────────────────────────────
const secureTokenFactory   = new SecureTokenFactory();
const refreshTokenFactory  = new RefreshTokenFactory();
const accessTokenFactory   = new JwtAccessTokenFactory();

// ─── Services ─────────────────────────────────────────────────
const emailService   = new NodemailerEmailService();
const idGenerator    = new UUIDGenerator();
const passwordHasher = new Argon2PasswordHasher();
const unitOfWork     = new PrismaUnitOfWork(prisma);
const fileStorage    = new R2FileStorage(idGenerator);

// ─── Repositories ─────────────────────────────────────────────
const userRepo              = new PrismaUserRepository(prisma);
const clientRepo            = new PrismaClientRepository(prisma);
const tutorRepo             = new PrismaTutorRepository(prisma);
const refreshTokenRepo      = new PrismaRefreshTokenRepository(prisma);
const emailVerificationRepo = new PrismaEmailVerificationRepository(prisma);
const passwordResetRepo     = new PrismaPasswordResetRepository(prisma);
const emailChangeRepo = new PrismaEmailChangeRepository(prisma);
const supportChatRepo = new PrismaSupportChatRepository(prisma, fileStorage);
const lessonRepo = new PrismaLessonRepository(prisma);
const scheduleRepo = new PrismaRegularScheduleRepository(prisma);
const materialRepo = new PrismaLessonMaterialRepository(prisma);

const slotRepo = new PrismaAvailableSlotRepository(prisma);
const appealRepo = new PrismaAppealRepository(prisma);

// Quiz
const quizRepo = new PrismaQuizRepository(prisma);
const questionRepo = new PrismaQuizQuestionRepository(prisma);
const lessonQuizRepo = new PrismaLessonQuizRepository(prisma);
const attemptRepo = new PrismaQuizAttemptRepository(prisma);
const answerRepo = new PrismaQuizAnswerRepository(prisma);
const quizFeedbackRepo = new PrismaQuizAnswerFeedbackRepository(prisma);

// Review
const reviewRepo = new PrismaReviewRepository(prisma);


// ─── Profile Creators ─────────────────────────────────────────
const clientProfileCreator = new ClientProfileCreator(clientRepo);
const tutorProfileCreator  = new TutorProfileCreator(tutorRepo);

// feedback
const feedbackRepo = new PrismaFeedbackRepository(prisma);


// ══════════════════════════════════════════════════════════════
// USE CASES
// ══════════════════════════════════════════════════════════════

// ─── Registration ─────────────────────────────────────────────
const registerClientUseCase = new RegisterUserUseCase(
  userRepo,
  clientProfileCreator,
  emailVerificationRepo,
  emailService,
  idGenerator,
  passwordHasher,
  unitOfWork,
  secureTokenFactory,
);

const registerTutorUseCase = new RegisterUserUseCase(
  userRepo,
  tutorProfileCreator,
  emailVerificationRepo,
  emailService,
  idGenerator,
  passwordHasher,
  unitOfWork,
  secureTokenFactory,
);


const activateAccountUseCase = new ActivateAccountUseCase(
  userRepo,
  emailVerificationRepo,
  unitOfWork,
  secureTokenFactory
);

const resendVerificationUseCase = new ResendVerificationUseCase(
  userRepo,
  emailVerificationRepo,
  emailService,
  unitOfWork,
  secureTokenFactory,
);


const loginUseCase = new LoginUseCase(
  userRepo,
  refreshTokenRepo,
  passwordHasher,
  accessTokenFactory,
  refreshTokenFactory,
  clientRepo,
  tutorRepo,
);

const logoutUseCase = new LogoutUseCase(
  refreshTokenRepo,
  refreshTokenFactory,
);

const switchRoleUseCase = new SwitchRoleUseCase(
  userRepo,
  accessTokenFactory,
  clientRepo,
  tutorRepo,
);

// ─── Tokens / Sessions ────────────────────────────────────────
const refreshTokenUseCase = new RefreshTokenUseCase(
  userRepo,
  refreshTokenRepo,
  accessTokenFactory,
  refreshTokenFactory,
  clientRepo,
  tutorRepo,
);

const getActiveSessionsUseCase = new GetActiveSessionsUseCase(refreshTokenRepo, refreshTokenFactory);
const revokeSessionUseCase     = new RevokeSessionUseCase(refreshTokenRepo);
const revokeAllSessionsUseCase = new RevokeAllSessionsUseCase(refreshTokenRepo, userRepo);

// ─── Password ─────────────────────────────────────────────────
const changePasswordUseCase = new ChangePasswordUseCase(
  userRepo,
  refreshTokenRepo,
  passwordHasher,
);

const forgotPasswordUseCase = new ForgotPasswordUseCase(
  userRepo,
  passwordResetRepo,
  emailService,
  secureTokenFactory,
);

const resetPasswordUseCase = new ResetPasswordUseCase(
  userRepo,
  refreshTokenRepo,
  passwordResetRepo,
  passwordHasher,
  secureTokenFactory,
);

// ─── Email Change ─────────────────────────────────────────────
const requestEmailChangeUseCase = new RequestEmailChangeUseCase(
  userRepo,
  emailChangeRepo,
  passwordHasher,
  emailService,
  secureTokenFactory
);

const confirmEmailChangeUseCase = new ConfirmEmailChangeUseCase(
  userRepo,
  emailChangeRepo,
  secureTokenFactory,
);


// LESSON
const cancelLessonUseCase = new CancelLessonUseCase(lessonRepo);
const completeLessonUseCase = new CompleteLessonUseCase(lessonRepo);
const generateNextRegularLessonUseCase = new GenerateNextRegularLessonUseCase(scheduleRepo, lessonRepo, idGenerator);
const createTrialUseCase = new CreateTrialLessonUseCase(
  lessonRepo, 
  clientRepo, 
  tutorRepo, 
  unitOfWork, 
  idGenerator
);
const getLessonUseCase = new GetUserLessonUseCase(lessonRepo);
const confirmLessonUseCase = new ConfirmLessonUseCase(lessonRepo, tutorRepo);
const rejectLessonUseCase = new RejectLessonUseCase(lessonRepo);
const proposeRescheduleUseCase = new ProposeLessonRescheduleUseCase(lessonRepo);
const acceptRescheduleUseCase = new AcceptRescheduleProposalUseCase(
  lessonRepo, 
  unitOfWork, 
  idGenerator
);
const declineRescheduleUseCase = new DeclineRescheduleProposalUseCase(lessonRepo);
const rescheduleLessonUseCase = new RescheduleLessonByClientUseCase(
  lessonRepo, 
  unitOfWork, 
  idGenerator
);
const markNoShowClientUseCase = new MarkNoShowClientUseCase(lessonRepo);
const markNoShowTutorUseCase = new MarkNoShowTutorUseCase(lessonRepo);
const uploadMaterialUseCase = new UploadLessonMaterialUseCase(
  lessonRepo, 
  materialRepo, 
  fileStorage, 
  idGenerator
);
const getMaterialUseCase = new GetLessonMaterialUseCase(
  lessonRepo,
  materialRepo, 
  fileStorage
);
const deleteMaterialUseCase = new DeleteLessonMaterialUseCase(
  materialRepo, 
  fileStorage
); 
const createRegularScheduleUseCase = new CreateRegularScheduleUseCase(
  scheduleRepo, 
  lessonRepo, 
  clientRepo, 
  tutorRepo, 
  unitOfWork, 
  idGenerator
);
const cancelRegularScheduleUseCase = new CancelRegularScheduleUseCase(
  scheduleRepo, 
  lessonRepo, 
  cancelLessonUseCase,
  unitOfWork
);
const cancelSingleLessonUseCase = new CancelSingleLessonUseCase(lessonRepo);
const startLessonUseCase = new StartLessonUseCase(
  lessonRepo,
  idGenerator
);


// PERSON
const getProfileUseCase = new GetUserProfileUseCase(userRepo, clientRepo, tutorRepo);
const updateProfileUseCase = new UpdateUserProfileUseCase(userRepo);

// TUTOR
const getPendingTutorsUseCase = new GetPendingTutorsUseCase(tutorRepo);
const approveTutorUseCase = new ApproveTutorUseCase(tutorRepo, userRepo, emailService);
const rejectTutorUseCase = new RejectTutorUseCase(tutorRepo, userRepo, emailService);

const startTutorReviewUseCase = new StartTutorReviewUseCase(tutorRepo);
const submitTutorApplicationUseCase = new SubmitTutorApplicationUseCase(tutorRepo);

const getTutorPublicProfileUseCase = new GetTutorPublicProfileUseCase(tutorRepo, userRepo, prisma);
const getTutorPublicListUseCase = new GetTutorPublicListUseCase(tutorRepo); 

const updateTutorProfileUseCase = new UpdateTutorProfileUseCase(tutorRepo);
const getTutorByUserIdUseCase = new GetTutorByUserIdUseCase(tutorRepo);



// AVAILABLE
const createSlotUseCase = new CreateAvailableSlotUseCase(
  slotRepo, 
  tutorRepo, 
  idGenerator
)
const deleteSlotUseCase = new DeleteAvailableSlotUseCase(slotRepo);
const getOwnSlotsUseCase = new GetTutorOwnSlotsUseCase(slotRepo);
const getPublicSlotsUseCase = new GetTutorPublicSlotsUseCase(slotRepo);

// APPEAL
const createAppealUseCase = new CreateAppealUseCase(
  appealRepo, 
  lessonRepo, 
  idGenerator
);
const getAppealsUseCase = new GetAppealsUseCase(appealRepo);
const resolveAppealUseCase = new ResolveAppealUseCase(appealRepo);
const rejectAppealUseCase = new RejectAppealUseCase(appealRepo);

// QUIZ
const createQuizUseCase = new CreateQuizUseCase(
  quizRepo, 
  tutorRepo, 
  idGenerator
);


const addQuestionUseCase = new AddQuizQuestionUseCase(
  quizRepo, 
  questionRepo, 
  idGenerator
); 
const assignToLessonUseCase = new AssignQuizToLessonUseCase(
  quizRepo, 
  lessonRepo, 
  lessonQuizRepo
);
const startAttemptUseCase = new StartQuizAttemptUseCase(
  quizRepo, 
  lessonRepo, 
  attemptRepo, 
  idGenerator
);
const submitAttemptUseCase = new SubmitQuizAttemptUseCase(
  attemptRepo, 
  questionRepo, 
  idGenerator
);
const provideAnswerFeedbackUseCase = new ProvideAnswerFeedbackUseCase(
  attemptRepo, 
  quizFeedbackRepo, 
  answerRepo, 
  idGenerator, 
  unitOfWork
);

// SUPPORT CHAT
const joinSupportChatUseCase = new JoinSupportChatUseCase(supportChatRepo);
const sendSupportMessageUseCase = new SendSupportChatMessageUseCase(supportChatRepo);
const getSupportChatHistoryUseCase = new GetSupportChatHistoryUseCase(supportChatRepo);
const getAllSupportChatsUseCase = new GetAllSupportChatsUseCase(supportChatRepo);
const getSupportChatByIdUseCase = new GetSupportChatByIdUseCase(supportChatRepo);

// REVIEW 
const submitReviewUseCase = new SubmitReviewUseCase(
  reviewRepo, 
  lessonRepo, 
  idGenerator
);
const getTutorReviewsUseCase = new GetTutorReviewsUseCase(reviewRepo);

// FEEDBACK
const submitFeedbackUseCase = new SubmitFeedbackUseCase(
  feedbackRepo,
  idGenerator
);

// JOBS /////////////////////////////////////////
const autoCompleteLesson = new AutoCompleteLessonsJob(
  prisma,
  completeLessonUseCase,
  generateNextRegularLessonUseCase,
  (lessonId: string) => appEvents.emit(AppEvents.LESSON_COMPLETED, lessonId),
);
const autoCancelPending    = new AutoCancelPendingJob(prisma);
const autoExpireReschedule = new AutoExpireRescheduleJob(prisma);
const sendLessonReminders  = new SendLessonRemindersJob(prisma, emailService);
//////////////////////////////////////////////////



// ══════════════════════════════════════════════════════════════
// CONTROLLERS
// ══════════════════════════════════════════════════════════════

const authController = new AuthController(
  registerClientUseCase,
  registerTutorUseCase,
  activateAccountUseCase,
  loginUseCase,
  logoutUseCase,
  refreshTokenUseCase,
  switchRoleUseCase,
  changePasswordUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  getActiveSessionsUseCase,
  revokeSessionUseCase,
  revokeAllSessionsUseCase,
  requestEmailChangeUseCase,
  confirmEmailChangeUseCase,
  resendVerificationUseCase
);

const profileController = new ProfileController(getProfileUseCase, updateProfileUseCase);

const lessonController = new LessonController(
  createTrialUseCase, 
  getLessonUseCase, 
  confirmLessonUseCase, 
  rejectLessonUseCase, 
  startLessonUseCase, 
  completeLessonUseCase, 
  cancelLessonUseCase, 
  proposeRescheduleUseCase, 
  acceptRescheduleUseCase, 
  declineRescheduleUseCase, 
  rescheduleLessonUseCase, 
  markNoShowClientUseCase,
  markNoShowTutorUseCase, 
  uploadMaterialUseCase, 
  getMaterialUseCase, 
  deleteMaterialUseCase, 
  createRegularScheduleUseCase, 
  cancelRegularScheduleUseCase, 
  cancelSingleLessonUseCase
);
const availableSlotController = new AvailableSlotController(
  createSlotUseCase, 
  deleteSlotUseCase, 
  getOwnSlotsUseCase,
  getPublicSlotsUseCase
);
const appealController = new AppealController(
  createAppealUseCase, 
  getAppealsUseCase, 
  resolveAppealUseCase, 
  rejectAppealUseCase
);
const feedbackController = new FeedbackController(submitFeedbackUseCase);
const quizController = new QuizController(
  createQuizUseCase, 
  addQuestionUseCase, 
  assignToLessonUseCase, 
  startAttemptUseCase, 
  submitAttemptUseCase, 
  provideAnswerFeedbackUseCase
);
const supportChatController = new SupportChatController(
  joinSupportChatUseCase,
  getSupportChatHistoryUseCase,
  sendSupportMessageUseCase,
  getAllSupportChatsUseCase,
  getSupportChatByIdUseCase
);
const reviewController = new ReviewController(
  submitReviewUseCase, 
  getTutorReviewsUseCase
);


const getOwnProfileUseCase = new GetTutorOwnProfileUseCase(tutorRepo, userRepo, prisma);
const startReviewUseCase = new StartTutorReviewUseCase(tutorRepo);
const updateSubjectsUseCase = new UpdateTutorSubjectsUseCase(tutorRepo, prisma);
// TUTOR
const tutorController = new TutorController(
  getTutorByUserIdUseCase, getOwnProfileUseCase,
  getTutorPublicProfileUseCase, updateTutorProfileUseCase,
  getPendingTutorsUseCase, approveTutorUseCase, rejectTutorUseCase,
  submitTutorApplicationUseCase, startReviewUseCase,
  updateSubjectsUseCase
);
const tutorPublicController = new TutorPublicController(
  getTutorPublicListUseCase,
  getTutorPublicProfileUseCase,
);


export {
  prisma,
  accessTokenFactory,
  fileStorage,

  // CONTROLLERS
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
  supportChatController,

  // AUTH
  registerClientUseCase,
  registerTutorUseCase,
  activateAccountUseCase,
  resendVerificationUseCase,
  loginUseCase,
  logoutUseCase,
  refreshTokenUseCase,
  changePasswordUseCase,
  requestEmailChangeUseCase,
  confirmEmailChangeUseCase,

  // SUPPORT CHAT
  joinSupportChatUseCase,
  sendSupportMessageUseCase,
  getSupportChatHistoryUseCase,

  // LESSON
  completeLessonUseCase,
  generateNextRegularLessonUseCase,

  // JOBS
  autoCancelPending,
  autoExpireReschedule,
  autoCompleteLesson,
  sendLessonReminders,
};