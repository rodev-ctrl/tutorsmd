import { ISupportChatRepository, SupportMessageDto } from "../../ports/support-chat/ISupportChatFactory";
import { ForbiddenError } from "../../../domain/errors/ForbiddenError";
import { NotFoundError }  from "../../../domain/errors/NotFoundError";

export interface GetSupportChatHistoryInput {
  chatId:      string;
  requesterId: string;
  requesterRole: string;
  limit?:      number;  // default 50
  before?:     Date;    // курсор - сообщения старше этой даты
}

export interface GetSupportChatHistoryOutput {
  messages:   SupportMessageDto[];
  hasMore:    boolean; // есть ли ещё старые сообщения
}

export class GetSupportChatHistoryUseCase {
  constructor(private readonly supportChatRepo: ISupportChatRepository) {}

  async execute(input: GetSupportChatHistoryInput): Promise<GetSupportChatHistoryOutput> {
    const limit = Math.min(input.limit ?? 50, 100); // максимум 100 за раз

    // Проверяем доступ — клиент/тьютор только свой чат
    if (input.requesterRole !== "admin") {
      const chat = await this.supportChatRepo.findChatById(input.chatId);
      if (!chat) throw new NotFoundError("Chat not found");
      if (chat.userId !== input.requesterId) throw new ForbiddenError();
    }

    const messages = await this.supportChatRepo.getMessages(
      input.chatId,
      limit + 1, // берём на 1 больше чтобы узнать есть ли ещё
      input.before,
    );

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop(); // убираем лишнее

    return { messages, hasMore };
  }
}