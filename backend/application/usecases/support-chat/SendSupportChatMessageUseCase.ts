import {
  ISupportChatRepository,
  SupportMessageDto,
  AttachmentCreateInput,
} from "../../ports/support-chat/ISupportChatFactory";


export interface SendSupportChatMessageInput {
  chatId: string;
  senderId: string;
  senderRole: string;
  text?: string | null;
  attachments?: AttachmentCreateInput[];
}

export interface SendSupportChatMessageOutput {
  message: SupportMessageDto;
}

export class SendSupportChatMessageUseCase {
  constructor(
    private readonly supportChatRepo: ISupportChatRepository
  ) {}

  async execute(input: SendSupportChatMessageInput): Promise<SendSupportChatMessageOutput> {
    const hasText = Boolean(input.text?.trim());
    const hasAttachments = input.attachments && input.attachments.length > 0;

    if (!hasText && !hasAttachments) {
      throw new Error("Message must contain text or attachments");
    }

    const message = await this.supportChatRepo.createMessage({
      chatId: input.chatId,
      senderId: input.senderId,
      senderRole: input.senderRole,
      text: input.text ?? null,
      attachments: input.attachments ?? [],
    });

    return { message };
  }
}