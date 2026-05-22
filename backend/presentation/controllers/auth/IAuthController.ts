import { Request, Response } from 'express';

export interface IAuthController {
  // Registration
  registerClient(req: Request, res: Response): Promise<void>;
  registerTutor(req: Request, res: Response): Promise<void>;

  // Email verification
  activateAccount(req: Request, res: Response): Promise<void>;

  // Login / Logout
  login(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;

  // Tokens
  refresh(req: Request, res: Response): Promise<void>;
  switchRole(req: Request, res: Response): Promise<void>;

  // Password
  changePassword(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request, res: Response): Promise<void>;
  resetPassword(req: Request, res: Response): Promise<void>;

  // Email change
  requestEmailChange(req: Request, res: Response): Promise<void>;
  confirmEmailChange(req: Request, res: Response): Promise<void>;
  resendVerification(req: Request, res: Response): Promise<void>;

  // Sessions
  getActiveSessions(req: Request, res: Response): Promise<void>;
  revokeSession(req: Request, res: Response): Promise<void>;
  revokeAllSessions(req: Request, res: Response): Promise<void>;
}