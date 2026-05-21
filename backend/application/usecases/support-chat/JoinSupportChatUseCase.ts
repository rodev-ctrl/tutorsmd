// application/usecases/support-chat/JoinSupportChatUseCase.ts
// Вызывается когда юзер открывает виджет чата.
// Создаёт чат если нет, возвращает историю — всё за один round-trip.

import {
  ISupportChatRepository,
  SupportChatDto,
  SupportMessageDto,
} from "../../ports/support-chat/ISupportChatFactory";

export interface JoinSupportChatInput {
  userId: string;
}

export interface JoinSupportChatOutput {
  chat: SupportChatDto;
  messages: SupportMessageDto[];
}

export class JoinSupportChatUseCase {
  constructor(private readonly supportChatRepo: ISupportChatRepository) {}

  async execute(input: JoinSupportChatInput): Promise<JoinSupportChatOutput> {
    const chat = await this.supportChatRepo.findOrCreateChat(input.userId);
    const messages = await this.supportChatRepo.getMessages(chat.id);
    return { chat, messages };
  }
}