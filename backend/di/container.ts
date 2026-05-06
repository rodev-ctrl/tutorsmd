// di/container.ts

import { prisma } from '../infrastructure/database/prismaClient';

// ========== INFRASTRUCTURE — Repositories ==========
import { PrismaUserRepository } from '../infrastructure/database/repositories/PrismaUserRepository';
import { PrismaClientRepository } from '../infrastructure/database/repositories/PrismaClientRepository';
import { PrismaTutorRepository } from '../infrastructure/database/repositories/PrismaTutorRepository';
import { PrismaRefreshTokenRepository } from '../infrastructure/database/repositories/PrismaRefreshTokenRepository';
import { PrismaEmailVerificationRepository } from '../infrastructure/database/repositories/PrismaEmailVerificationRepository';

// ========== INFRASTRUCTURE — Services ==========
import { NodemailerEmailService } from '../infrastructure/email/NodemailerEmailService';
import { JwtAccessTokenService } from '../infrastructure/service/JwtAccessTokenService';
import { UUIDGenerator } from '../infrastructure/security/UUIDGenerator';
import { Argon2PasswordHasher } from '../infrastructure/security/Argon2PasswordHasher';
import { PrismaUnitOfWork } from '../infrastructure/database/PrismaUnitOfWork';

// ========== INFRASTRUCTURE — Profile Creators ==========
import { ClientProfileCreator } from '../infrastructure/profile-creators/ClientProfileCreator';
import { TutorProfileCreator } from '../infrastructure/profile-creators/TutorProfileCreator';

// ========== APPLICATION — Use Cases ==========
// ======== AUTH ===============================
import { RegisterUserUseCase } from '../application/usecases/auth/registration/RegisterUserUseCase';
import { ActivateAccountUseCase } from '../application/usecases/auth/activation/ActivateAccountUseCase';
import { LoginUseCase } from '../application/usecases/auth/login/LoginUseCase';
import { LogoutUseCase } from '../application/usecases/auth/login/LogoutUseCase';
import { RefreshTokenUseCase } from '../application/usecases/auth/token/RefreshTokenUseCase';
import { ChangePasswordUseCase } from '../application/usecases/auth/password/ChangePasswordUseCase';
import { SwitchRoleUseCase } from '../application/usecases/auth/login/SwitchRoleUseCase';
import { GetActiveSessionsUseCase } from '../application/usecases/auth/token/GetActiveSessionsUseCase';
import { RevokeSessionUseCase } from '../application/usecases/auth/token/RevokeSessionUseCase';
import { RevokeAllSessionsUseCase } from '../application/usecases/auth/token/RevokeAllSessionsUseCase';
import { ForgotPasswordUseCase } from '../application/usecases/auth/password/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../application/usecases/auth/password/ResetPasswordUseCase';
import { RequestEmailChangeUseCase } from '../application/usecases/auth/email/RequestEmailChangeUseCase';
import { ConfirmEmailChangeUseCase } from '../application/usecases/auth/email/ConfirmEmailChangeUseCase';


// ========== PRESENTATION — Controllers ==========
import { AuthController } from '../presentation/controllers/auth/AuthController';

// ─────────────────────────────────────────────
// REPOSITORIES
// ─────────────────────────────────────────────
const userRepo = new PrismaUserRepository(prisma);
const clientRepo = new PrismaClientRepository(prisma);
const tutorRepo = new PrismaTutorRepository(prisma);
const refreshTokenRepo = new PrismaRefreshTokenRepository(prisma);
const emailVerificationRepo = new PrismaEmailVerificationRepository(prisma);

// ─────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────
const emailService = new NodemailerEmailService();
const accessTokenService = new JwtAccessTokenService();
const idGenerator = new UUIDGenerator();
const passwordHasher = new Argon2PasswordHasher();
const unitOfWork = new PrismaUnitOfWork(prisma);

// ─────────────────────────────────────────────
// PROFILE CREATORS
// ─────────────────────────────────────────────
const clientProfileCreator = new ClientProfileCreator(clientRepo);
const tutorProfileCreator = new TutorProfileCreator(tutorRepo);

// ─────────────────────────────────────────────
// USE CASES — Auth
// ─────────────────────────────────────────────
const registerClientUseCase = new RegisterUserUseCase(
  userRepo,
  clientProfileCreator,
  emailVerificationRepo,
  emailService,
  idGenerator,
  passwordHasher,
  unitOfWork,
);

const registerTutorUseCase = new RegisterUserUseCase(
  userRepo,
  tutorProfileCreator,
  emailVerificationRepo,
  emailService,
  idGenerator,
  passwordHasher,
  unitOfWork,
);

const activateAccountUseCase = new ActivateAccountUseCase(
  userRepo,
  emailVerificationRepo,
);

const loginUseCase = new LoginUseCase(
  userRepo,
  refreshTokenRepo,
  passwordHasher,
  accessTokenService,
);

const logoutUseCase = new LogoutUseCase(
    refreshTokenRepo
);

const refreshTokenUseCase = new RefreshTokenUseCase(
  userRepo,
  refreshTokenRepo,
  accessTokenService
);

const changePasswordUseCase = new ChangePasswordUseCase(
  userRepo,
  refreshTokenRepo,
  passwordHasher,
);

const switchRoleUseCase = new SwitchRoleUseCase(
  userRepo,
  accessTokenService
)

const getActiveSessionsUseCase = new GetActiveSessionsUseCase(refreshTokenRepo);
const revokeSessionUseCase = new RevokeSessionUseCase(refreshTokenRepo);
const revokeAllSessionsUseCase = new RevokeAllSessionsUseCase(refreshTokenRepo);
 

const forgotPasswordUseCase = new ForgotPasswordUseCase(
  userRepo, 
  passwordResetRepo,
  emailService, 
  idGenerator,
);
 
const resetPasswordUseCase = new ResetPasswordUseCase(
  userRepo, refreshTokenRepo, passwordHasher,
);
 
const requestEmailChangeUseCase = new RequestEmailChangeUseCase(
  userRepo, emailService, idGenerator,
);
 
const confirmEmailChangeUseCase = new ConfirmEmailChangeUseCase(userRepo);
 

// ─────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────

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
);


// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
export {
  prisma,
  authController,
  // use cases экспортируем если нужны в других контроллерах
  registerClientUseCase,
  registerTutorUseCase,
  activateAccountUseCase,
  loginUseCase,
  logoutUseCase,
  refreshTokenUseCase,
  changePasswordUseCase,
};