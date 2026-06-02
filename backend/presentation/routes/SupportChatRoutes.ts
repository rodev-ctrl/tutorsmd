import { Router } from 'express';
import { ISupportChatController } from '../controllers/support-chat/ISupportChatController';
import { requireAuth } from '../middlewares/auth/requireAuth';
import { validate } from '../middlewares/validate';
import { wrap } from './wrapper';
import {
  ChatIdParamsSchema,
  GetSupportHistoryQuerySchema,
  SendSupportChatMessageSchema,
} from '../controllers/support-chat/support-chat.schema';
import { supportChatJoinLimiter, supportChatLimiter } from '../middlewares/rateLimiter';

export const createSupportChatRouter = (
  controller: ISupportChatController
): Router => {
  const router = Router();

  router.use(requireAuth);

  // ─── JOIN ─────────────────────────────────────────────
  router.post(
    '/join',
    supportChatJoinLimiter,
    wrap(async (req, res) => {
      await controller.join(req, res);
    })
  );

  // ─── GET HISTORY ──────────────────────────────────────
  router.get(
    '/:chatId/history',
    validate(ChatIdParamsSchema, 'params'),
    validate(GetSupportHistoryQuerySchema, 'query'),
    wrap(async (req, res) => {
      await controller.getHistory(req as any, res);
    })
  );

  // ─── SEND MESSAGE ─────────────────────────────────────
  router.post(
    '/:chatId/messages',
    supportChatLimiter,
    validate(ChatIdParamsSchema, 'params'),
    validate(SendSupportChatMessageSchema),
    wrap(async (req, res) => {
      await controller.sendMessage(req as any, res);
    })
  );

  return router;
};