import { Request, Response, Router } from 'express';
import { IAuthController } from '../controllers/auth/IAuthController';
import { requireAuth } from '../middlewares/requireAuth';
import { validate } from '../middlewares/validate';
import {
  RegisterSchema,
  ActivateAccountSchema,
  ResendVerificationSchema,
  LoginSchema,
  RefreshSchema,
  SwitchRoleSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  RequestEmailChangeSchema,
  RevokeSessionSchema,
} from '../controllers/auth/auth.schema';
import { wrap } from './wrapper';

  
export const createAuthRouter = (controller: IAuthController): Router => {
  const router = Router();

  // ─── Registration ─────────────────────────────────────────
  router.post(
    '/register/client',
    validate(RegisterSchema),
    wrap((req, res) => controller.registerClient(req, res)),
  );

  router.post(
    '/register/tutor',
    validate(RegisterSchema),
    wrap((req, res) => controller.registerTutor(req, res)),
  );

  // ─── Activation ───────────────────────────────────────────
  // token в params — валидируем params
  router.post(
    '/activate/:token',
    validate(ActivateAccountSchema, 'params'),
    wrap((req, res) => controller.activateAccount(req, res)),
  );

  router.post(
    '/resend-verification',
    validate(ResendVerificationSchema),
    wrap((req, res) => controller.resendVerification(req, res)),
  );

  // ─── Login / Logout ───────────────────────────────────────
  router.post(
    '/login',
    validate(LoginSchema),
    wrap((req, res) => controller.login(req, res)),
  );

  router.post(
    '/logout',
    requireAuth,
    wrap((req, res) => controller.logout(req, res)),
  );

  // ─── Tokens ───────────────────────────────────────────────
  router.post(
    '/refresh',
    validate(RefreshSchema),
    wrap((req, res) => controller.refresh(req, res)),
  );

  router.post(
    '/switch-role',
    requireAuth,
    validate(SwitchRoleSchema),
    wrap((req, res) => controller.switchRole(req, res)),
  );

  // ─── Password ─────────────────────────────────────────────
  router.put(
    '/change-password',
    requireAuth,
    validate(ChangePasswordSchema),
    wrap((req, res) => controller.changePassword(req, res)),
  );

  router.post(
    '/forgot-password',
    validate(ForgotPasswordSchema),
    wrap((req, res) => controller.forgotPassword(req, res)),
  );

  // token в params — берём из URL, newPassword из body
  router.post(
    '/reset-password/:token',
    validate(ActivateAccountSchema, 'params'), // проверяем что token не пустой
    validate(ResetPasswordSchema),
    wrap((req, res) => controller.resetPassword(req, res)),
  );

  // ─── Email Change ─────────────────────────────────────────
  router.post(
    '/email/change',
    requireAuth,
    validate(RequestEmailChangeSchema),
    wrap((req, res) => controller.requestEmailChange(req, res)),
  );

  router.get(
    '/email/change/:token',
    wrap((req, res) => controller.confirmEmailChange(req, res)),
  );

  // ─── Sessions ─────────────────────────────────────────────
  router.get(
    '/sessions',
    requireAuth,
    wrap((req: Request, res: Response) => controller.getActiveSessions(req, res)),
  );

  router.delete(
    '/sessions',
    requireAuth,
    validate(RevokeSessionSchema, 'params'),
    wrap((req: Request, res: Response) => controller.revokeAllSessions(req, res)),
  );

  router.delete(
    '/sessions/:tokenHash',
    requireAuth,
    validate(RevokeSessionSchema, 'params'),
    wrap((req: Request, res: Response) => controller.revokeSession(req, res)),
  );

  return router;
};