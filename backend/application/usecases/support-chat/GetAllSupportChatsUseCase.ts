import { ISupportChatRepository, SupportChatDto } from "../../ports/support-chat/ISupportChatFactory";
import { ForbiddenError } from "../../../domain/errors/ForbiddenError";

export interface GetAllSupportChatsOutput {
  chats: SupportChatDto[];
}

export class GetAllSupportChatsUseCase {
  constructor(private readonly supportChatRepo: ISupportChatRepository) {}

  async execute(requesterRole: string): Promise<GetAllSupportChatsOutput> {
    if (requesterRole !== "admin") {
      throw new ForbiddenError("Only admins can view all support chats");
    }

    const chats = await this.supportChatRepo.findAllChats();

    return { chats };
  }
}