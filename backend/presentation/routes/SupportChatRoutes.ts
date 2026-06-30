import { Router } from 'express';
import { ISupportChatController } from '../controllers/support-chat/ISupportChatController';
import { requireAuth } from '../middlewares/auth/requireAuth';
import { validate } from '../middlewares/validate';
import { wrap } from './wrapper';
import {
  ChatIdParamsSchema,
  GetSupportHistoryQuerySchema,
  SendSupportChatMessageSchema,
  ChatIdParams,
} from '../controllers/support-chat/support-chat.schema';
import { supportChatJoinLimiter, supportChatLimiter } from '../middlewares/rateLimiter';

export const createSupportChatRouter = (
  controller: ISupportChatController
): Router => {
  const router = Router();

  router.use(requireAuth);

  // ─── GET ALL CHATS (ADMIN ONLY) ──────────────────────────────────────
router.get(
  '/chats',
  wrap(async (req, res) => {
    await controller.getAllChats(req, res);  
  })
);

router.get(
  '/chats/:chatId',
  validate(ChatIdParamsSchema, 'params'),
  wrap<ChatIdParams>(async (req, res) => {
    await controller.getChatById(req, res);
  })
);

  // ─── JOIN ─────────────────────────────────────────────
  router.post(
    '/join',
    supportChatJoinLimiter,
    wrap(async (req, res) => {
      await controller.join(req, res);
    })
  );

  // повторяет join, но надо посмотреть, мейби потом разделю
  router.get(
  '/chat',
  wrap(async (req, res) => {
    await controller.getMyChat(req, res);
  })
);

  

  // ─── GET HISTORY ──────────────────────────────────────
  router.get(
    '/:chatId/history',
    validate(ChatIdParamsSchema, 'params'),
    validate(GetSupportHistoryQuerySchema, 'query'),
    wrap<ChatIdParams, {}, {}, { limit?: number; before?: string }>(async (req, res) => {
      await controller.getHistory(req, res);
    })
  );

  // ─── SEND MESSAGE ─────────────────────────────────────
  router.post(
    '/:chatId/messages',
    supportChatLimiter,
    validate(ChatIdParamsSchema, 'params'),
    validate(SendSupportChatMessageSchema),
    wrap<ChatIdParams, {}, { text?: string; attachments?: { key: string; name: string; mimeType: string; size: number }[] }>(async (req, res) => {
      await controller.sendMessage(req, res);
    })
  );

  return router;
};