// di/container.ts

import { PrismaClient } from '../generated/prisma';

// ========== PRISMA ==========
const prisma = new PrismaClient();

// ========== INFRASTRUCTURE — Repositories ==========
import { PrismaUserRepository } from '../infrastructure/database/repositories/PrismaUserRepository';
import { PrismaClientRepository } from '../infrastructure/database/repositories/PrismaClientRepository';
import { PrismaTutorRepository } from '../infrastructure/database/repositories/PrismaTutorRepository';
import { PrismaRefreshTokenRepository } from '../infrastructure/database/repositories/PrismaRefreshTokenRepository';
import { PrismaEmailVerificationRepository } from '../infrastructure/database/repositories/PrismaEmailVerificationRepository';

// ========== INFRASTRUCTURE — Services ==========
import { NodemailerEmailService } from '../infrastructure/email/NodemailerEmailService';
import { JwtAccessTokenService } from '../infrastructure/service/JwtAccessTokenService';
import { UuidGenerator } from '../infrastructure/security/UUIDGenerator';
import { Argon2PasswordHasher } from '../infrastructure/security/Argon2PasswordHasher';
import { PrismaUnitOfWork } from '../infrastructure/database/PrismaUnitOfWork';

// ========== INFRASTRUCTURE — Profile Creators ==========
import { ClientProfileCreator } from '../infrastructure/profile-creators/ClientProfileCreator';
import { TutorProfileCreator } from '../infrastructure/profile-creators/TutorProfileCreator';

// ========== APPLICATION — Use Cases ==========
import { RegisterUserUseCase } from '../application/usecases/auth/RegisterUserUseCase';
import { ActivateAccountUseCase } from '../application/usecases/auth/ActivateAccountUseCase';
import { LoginUseCase } from '../application/usecases/auth/LoginUseCase';
import { LogoutUseCase } from '../application/usecases/auth/LogoutUseCase';
import { RefreshTokenUseCase } from '../application/usecases/auth/RefreshTokenUseCase';
import { ChangePasswordUseCase } from '../application/usecases/auth/ChangePasswordUseCase';

// ========== PRESENTATION — Controllers ==========
import { AuthController } from '../presentation/controllers/authController';

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
const idGenerator = new UuidGenerator();
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
  tokenService,
  idGenerator,
);

const changePasswordUseCase = new ChangePasswordUseCase(
  userRepo,
  refreshTokenRepo,
  passwordHasher,
);

// ─────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────
/*
const authController = new AuthController(
  registerClientUseCase,
  registerTutorUseCase,
  activateAccountUseCase,
  loginUseCase,
  logoutUseCase,
  refreshTokenUseCase,
  changePasswordUseCase,
);
*/

const authController = new AuthController(
  loginUseCase
)

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