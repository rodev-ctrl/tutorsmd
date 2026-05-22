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

// ─── Controllers ──────────────────────────────────────────────
import { AuthController } from '../presentation/controllers/auth/AuthController';
import { GetSupportChatHistoryUseCase } from '../application/usecases/support-chat/GetSupportChatHistoryUsecase';



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
const emailChangeRepo       = new PrismaEmailChangeRepository(prisma);
const supportChatRepo       = new PrismaSupportChatRepository(prisma, fileStorage);
const lessonRepo            = new PrismaLessonRepository(prisma);


// ─── Profile Creators ─────────────────────────────────────────
const clientProfileCreator = new ClientProfileCreator(clientRepo);
const tutorProfileCreator  = new TutorProfileCreator(tutorRepo);

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
);

const logoutUseCase = new LogoutUseCase(
  refreshTokenRepo,
  refreshTokenFactory,
);

const switchRoleUseCase = new SwitchRoleUseCase(
  userRepo,
  accessTokenFactory,
);

// ─── Tokens / Sessions ────────────────────────────────────────
const refreshTokenUseCase = new RefreshTokenUseCase(
  userRepo,
  refreshTokenRepo,
  accessTokenFactory,
  refreshTokenFactory,
);

const getActiveSessionsUseCase = new GetActiveSessionsUseCase(refreshTokenRepo);
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

// ─── Support ──────────────────────────────────────────────────
const joinSupportChatUseCase    = new JoinSupportChatUseCase(supportChatRepo);
const sendSupportMessageUseCase = new SendSupportChatMessageUseCase(supportChatRepo);
const getSupportChatHistoryUseCase = new GetSupportChatHistoryUseCase(supportChatRepo);

// LESSON
const completeLessonUseCase = new CompleteLessonUseCase(lessonRepo);


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

// ══════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════

export {
  prisma,
  accessTokenFactory,
  fileStorage,

  // Controllers
  authController,

  // Auth use cases — нужны в роутерах и WebSocket
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

  // Support use cases — нужны в WebSocket
  joinSupportChatUseCase,
  sendSupportMessageUseCase,
  getSupportChatHistoryUseCase,
  completeLessonUseCase,
};