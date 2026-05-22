import { Request, Response } from 'express';
import { IAuthController } from './IAuthController';
import { RegisterUserUseCase } from '../../../application/usecases/auth/registration/RegisterUserUseCase';
import { ActivateAccountUseCase } from '../../../application/usecases/auth/activation/ActivateAccountUseCase';
import { LoginUseCase } from '../../../application/usecases/auth/login/LoginUseCase';
import { LogoutUseCase } from '../../../application/usecases/auth/login/LogoutUseCase';
import { RefreshTokenUseCase } from '../../../application/usecases/auth/token/RefreshTokenUseCase';
import { SwitchRoleUseCase } from '../../../application/usecases/auth/login/SwitchRoleUseCase';
import { ChangePasswordUseCase } from '../../../application/usecases/auth/password/ChangePasswordUseCase';
import { ForgotPasswordUseCase } from '../../../application/usecases/auth/password/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../../application/usecases/auth/password/ResetPasswordUseCase';
import { Role } from '../../../domain/entities/User';
import { GetActiveSessionsUseCase } from '../../../application/usecases/auth/token/GetActiveSessionsUseCase';
import { RevokeSessionUseCase } from '../../../application/usecases/auth/token/RevokeSessionUseCase';
import { RevokeAllSessionsUseCase } from '../../../application/usecases/auth/token/RevokeAllSessionsUseCase';
import { RequestEmailChangeUseCase } from '../../../application/usecases/auth/email/RequestEmailChangeUseCase';
import { ConfirmEmailChangeUseCase } from '../../../application/usecases/auth/email/ConfirmEmailChangeUseCase';
import { ResendVerificationUseCase } from '../../../application/usecases/auth/activation/ResendVerificationUseCase';


const REFRESH_COOKIE_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};


export class AuthController implements IAuthController {
   constructor(
    private readonly registerClientUseCase: RegisterUserUseCase,
    private readonly registerTutorUseCase: RegisterUserUseCase,
    private readonly activateAccountUseCase: ActivateAccountUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly switchRoleUseCase: SwitchRoleUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly getActiveSessionsUseCase: GetActiveSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly revokeAllSessionsUseCase: RevokeAllSessionsUseCase,
    private readonly requestEmailChangeUseCase: RequestEmailChangeUseCase,
    private readonly confirmEmailChangeUseCase: ConfirmEmailChangeUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase
  ) {}

  
  // ─── Registration ────────────────────────────────────────────

  async registerClient(req: Request, res: Response): Promise<void> {
    const { name, surname, email, password, timezone } = req.body;

    await this.registerClientUseCase.execute({
      name,
      surname,
      email,
      password,
      timezone,
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email to activate your account.',
    });
  }

  async registerTutor(req: Request, res: Response): Promise<void> {
    const { name, surname, email, password, timezone } = req.body;

    await this.registerTutorUseCase.execute({
      name,
      surname,
      email,
      password,
      timezone,
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email to activate your account.',
    });
  }

  // ─── Email Verification ──────────────────────────────────────

  async activateAccount(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    await this.activateAccountUseCase.execute(token);

    res.status(200).json({ message: 'Account activated successfully.' });
  }

  // ─── Login / Logout ──────────────────────────────────────────

  async login(req: Request, res: Response): Promise<void> {
    const { email, password, activeRole, deviceInfo } = req.body;

    const result = await this.loginUseCase.execute({
      email,
      password,
      activeRole: activeRole as Role,
      deviceInfo: deviceInfo ?? req.headers['user-agent'],
    });

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(400).json({ message: 'No refresh token provided' });
      return;
    }

    await this.logoutUseCase.execute(refreshToken);

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully.' });
  }

  // ─── Tokens ──────────────────────────────────────────────────

  async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token provided' });
      return;
    }

    const { activeRole } = req.body;

    const result = await this.refreshTokenUseCase.execute(
      refreshToken,
      activeRole as Role,
    );

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({ accessToken: result.accessToken });
  }

  async switchRole(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { newRole } = req.body;

    const result = await this.switchRoleUseCase.execute(
      userId,
      newRole as Role,
    );

    res.status(200).json({ accessToken: result.accessToken });
  }

  // ─── Password ────────────────────────────────────────────────

  async changePassword(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { oldPassword, newPassword } = req.body;

    await this.changePasswordUseCase.execute(userId, oldPassword, newPassword);

    // Инвалидируем cookie — все сессии отозваны в use case
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Password changed. Please login again.' });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    await this.forgotPasswordUseCase.execute({ email });

    // Всегда один ответ — защита от email enumeration
    res.status(200).json({
      message: 'If this email exists, a reset link has been sent.',
    });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { newPassword } = req.body;
    const { token } = req.params;

    await this.resetPasswordUseCase.execute(token, newPassword);

    res.status(200).json({ message: 'Password reset successfully. Please login.' });
  }

  // ─── Email Change ────────────────────────────────────────────

  async requestEmailChange(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { newEmail, password } = req.body;

  await this.requestEmailChangeUseCase.execute({ userId, newEmail, password });

  res.status(200).json({
    message: 'Confirmation link sent to your new email address.',
  });
}

async confirmEmailChange(req: Request, res: Response): Promise<void> {
  const { token } = req.params;   

  await this.confirmEmailChangeUseCase.execute(token);

  res.status(200).json({ message: 'Email changed successfully.' });
}

async resendVerification(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  await this.resendVerificationUseCase.execute(email);

  res.status(200).json({ message: 'Verification link sent' })
}

  // ─── Sessions ────────────────────────────────────────────────

 async getActiveSessions(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const sessions = await this.getActiveSessionsUseCase.execute(userId);
    res.status(200).json({ sessions });
  }

  async revokeSession(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { tokenHash } = req.params;
    await this.revokeSessionUseCase.execute(userId, tokenHash);
    res.status(200).json({ message: 'Session revoked.' });
  }

  async revokeAllSessions(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    await this.revokeAllSessionsUseCase.execute(userId);
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'All sessions revoked.' });
  }
}
