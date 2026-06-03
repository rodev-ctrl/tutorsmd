import { Request, Response } from 'express';

import { ISupportChatController } from './ISupportChatController';

import { JoinSupportChatUseCase } from '../../../application/usecases/support-chat/JoinSupportChatUseCase';
import { GetSupportChatHistoryUseCase } from '../../../application/usecases/support-chat/GetSupportChatHistoryUseCase';
import { SendSupportChatMessageUseCase } from '../../../application/usecases/support-chat/SendSupportChatMessageUseCase';

import {
  SendSupportChatMessageBody,
  GetSupportHistoryQueryDto,
  ChatIdParams
} from './support-chat.schema';



export class SupportChatController implements ISupportChatController {
  constructor(
    private readonly joinUseCase: JoinSupportChatUseCase,
    private readonly getHistoryUseCase: GetSupportChatHistoryUseCase,
    private readonly sendMessageUseCase: SendSupportChatMessageUseCase,
  ) {}

  // POST /support/chat/join
  async join(
    req: Request<{}, {}, never>,
    res: Response,
  ): Promise<void> {
    const userId = req.user!.userId;

    const result = await this.joinUseCase.execute({
      userId,
    });

    res.status(200).json(result);
  }

  // GET /support/chat/:chatId/history
  async getHistory(
    req: Request<
      ChatIdParams,
      {},
      {},
      GetSupportHistoryQueryDto
    >,
    res: Response,
  ): Promise<void> {
    const requesterId = req.user!.userId;
    const requesterRole = req.user!.activeRole;

    const { chatId } = req.params;
    const { limit, before } = req.query;

    const result = await this.getHistoryUseCase.execute({
      chatId,
      requesterId,
      requesterRole,
      limit,
      before: before ? new Date(before) : undefined,
    });

    res.status(200).json(result);
  }

  async getMyChat(req: Request, res: Response) {
  const userId = req.user!.userId;

  const result = await this.joinUseCase.execute({
    userId,
  });

  res.status(200).json(result);
}

  // POST /support/chat/:chatId/messages
  async sendMessage(
    req: Request<
      ChatIdParams,
      {},
      SendSupportChatMessageBody
    >,
    res: Response,
  ): Promise<void> {
    const senderId = req.user!.userId;
    const senderRole = req.user!.activeRole;

    const { chatId } = req.params;

    const {
      text,
      attachments,
    } = req.body;

    const result = await this.sendMessageUseCase.execute({
      chatId,
      senderId,
      senderRole,
      text,
      attachments,
    });

    res.status(201).json(result);
  }
}