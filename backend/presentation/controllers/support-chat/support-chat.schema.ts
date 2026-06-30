// presentation/controllers/support-chat/support.schema.ts

import { z } from 'zod';

export const ChatIdParamsSchema = z.object({
  chatId: z.string().uuid(),
});

export const SupportAttachmentSchema = z.object({
  name: z.string().min(1).max(255),
  key: z.string().min(1).max(2000),
  mimeType: z.string().min(1).max(255),
  size: z.number().int().positive(),
});

export const SendSupportChatMessageSchema = z.object({
  text: z.string().max(5000).optional(),
  attachments: z.array(z.object({
    key:      z.string().min(1).max(500),
    name:     z.string().min(1).max(255),
    mimeType: z.string().min(1).max(100),
    size:     z.number().int().positive().max(25 * 1024 * 1024),
  })).max(5).optional(),
}).refine(
  (d) => d.text?.trim() || (d.attachments && d.attachments.length > 0),
  { message: "Message must contain text or attachments" },
);


export const GetSupportHistoryQuerySchema = z.object({
  limit:  z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().datetime().optional(),
});




export type SendSupportChatMessageBody = z.infer<typeof SendSupportChatMessageSchema>;

export type GetSupportHistoryQueryDto = z.infer<typeof GetSupportHistoryQuerySchema>;

export type ChatIdParams = z.infer<typeof ChatIdParamsSchema>;
