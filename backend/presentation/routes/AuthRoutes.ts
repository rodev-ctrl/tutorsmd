// presentation/routes/auth.routes.ts

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { requireAuth } from '../middlewares/requireAuth';

export const createAuthRouter = (authController: AuthController): Router => {
  const router = Router();

  // ─── Registration ───────────────────────────────────────────
  router.post('/register/client', (req, res) =>
    authController.registerClient(req, res)
  );
  router.post('/register/tutor', (req, res) =>
    authController.registerTutor(req, res)
  );

  // ─── Email Verification ──────────────────────────────────────
  router.post('/activate/:token', (req, res) =>
    authController.activateAccount(req, res)
  );

  // ─── Login / Logout ──────────────────────────────────────────
  router.post('/login', (req, res) =>
    authController.login(req, res)
  );
  router.post('/logout', requireAuth, (req, res) =>
    authController.logout(req, res)
  );

  // ─── Token ───────────────────────────────────────────────────
  router.post('/refresh', (req, res) =>
    authController.refresh(req, res)
  );
  router.post('/role/switch', requireAuth, (req, res) =>
    authController.switchRole(req, res)
  );

  // ─── Password ────────────────────────────────────────────────
  router.put('/password/change', requireAuth, (req, res) =>
    authController.changePassword(req, res)
  );
  router.post('/password/change', (req, res) =>
    authController.forgotPassword(req, res)
  );
  router.post('/reset-password', (req, res) =>
    authController.resetPassword(req, res)
  );

  // ─── Email Change ────────────────────────────────────────────
  router.post('/email/change', requireAuth, (req, res) =>
    authController.requestEmailChange(req, res)
  );
  router.get('/email/change/:token', (req, res) =>
    authController.confirmEmailChange(req, res)
  );

  // ─── Sessions ────────────────────────────────────────────────
  router.get('/sessions', requireAuth, (req, res) =>
    authController.getActiveSessions(req, res)
  );
  router.delete('/sessions', requireAuth, (req, res) =>
    authController.revokeAllSessions(req, res)
  );
  router.delete('/sessions/:tokenHash', requireAuth, (req, res) =>
    authController.revokeSession(req, res)
  );

  return router;
};