// di/container.ts

// Infrastructure — Repositories
import { SequelizeUserRepository } from '../infrastructure/database/repositories/SequelizeUserRepository';
import { SequelizeBookingRepository } from '../infrastructure/database/repositories/SequelizeBookingRepository';

// Infrastructure — Services (adapters implementing port interfaces)
import { NodemailerEmailService } from '../infrastructure/service/NodemailerEmailService';
import { JwtTokenService } from '../infrastructure/service/JwtTokenService';
import { UuidGenerator } from '../infrastructure/service/UuidGenerator';
import { BcryptPasswordHasher } from '../infrastructure/security/BcryptPasswordHasher';

// Application — Use Cases
import { RegisterClientUseCase } from '../application/usecases/auth/RegisterClientUse';
import { LoginUseCase } from '../application/usecases/auth/LoginUseCase';
import { ActivateAccountUseCase } from '../application/usecases/auth/ActivateAccountUseCase';
import { ChangePasswordUseCase } from '../application/usecases/auth/ChangePasswordUseCase';
import { CreateBookingUseCase } from '../application/usecases/booking/CreateBookingUseCase';

// Presentation — Controllers
import { AuthController } from '../presentation/controllers/authController';
import { SequelizeTokenRepository } from '../infrastructure/database/repositories/SequilezeTokenRepository';
import { LogoutUseCase } from '../application/usecases/auth/LogoutuseCase';
import { RefreshTokenUseCase } from '../application/usecases/auth/RefreshTokenUseCase';

// ========== REPOSITORIES ==========
const userRepo = new SequelizeUserRepository();
const tokenRepo = new SequelizeTokenRepository();
const bookingRepo = new SequelizeBookingRepository();

// ========== SERVICES ==========
const emailService = new NodemailerEmailService();
const tokenService = new JwtTokenService();
const uuidGenerator = new UuidGenerator();
const passwordHasher = new BcryptPasswordHasher();

// ========== USE CASES ==========
const registerClientUseCase = new RegisterClientUseCase(userRepo, emailService, uuidGenerator, passwordHasher);
const loginUseCase = new LoginUseCase(userRepo, tokenService, tokenRepo, passwordHasher);
const logoutUseCase = new LogoutUseCase(tokenService);
const refreshTokenUseCase = new RefreshTokenUseCase(tokenRepo, tokenService);
const activateAccountUseCase = new ActivateAccountUseCase(userRepo);
const changePasswordUseCase = new ChangePasswordUseCase(userRepo, tokenService, passwordHasher);
const createBookingUseCase = new CreateBookingUseCase(bookingRepo, userRepo, uuidGenerator);

// ========== CONTROLLERS ==========
// AuthController пока использует старый сервисный подход напрямую
const authController = new AuthController();

// ========== EXPORT ==========
export {
  // Controllers
  authController,

  tokenService,

  // Use Cases (для будущей инъекции в controllers)
  registerClientUseCase,
  loginUseCase,
  activateAccountUseCase,
  changePasswordUseCase,
  logoutUseCase,
  refreshTokenUseCase,
  createBookingUseCase
};
