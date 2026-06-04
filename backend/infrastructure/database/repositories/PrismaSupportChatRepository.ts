// infrastructure/database/repositories/PrismaSupportChatRepository.ts
//
// url файлов НЕ хранится в БД — только key (R2 object key).
// При каждой выдаче истории/сообщений генерируется presigned URL через fileStorage.
//
// Почему presigned, а не публичный URL:
//   • Файлы поддержки могут быть приватными — не должны быть доступны без аутентификации
//   • Presigned URL истекает → при компрометации ссылки данные не утекут навсегда
//   • При смене CDN/бакета достаточно поменять IFileStorageFactory — данные в БД не трогаем

import { PrismaClient, Prisma } from '@prisma/client';
import type { IFileStorageFactory }          from "../../../application/ports/file/IFileStorageFactory";
import type {
  ISupportChatRepository,
  CreateMessageInput,
  SupportChatDto,
  SupportMessageDto,
  SupportAttachmentDto
} from "../../../application/ports/support-chat/ISupportChatFactory";
import { FileMetadataDto } from "../../../application/ports/file/FileMetadataDto";


// ── Константы ─────────────────────────────────────────────────────────────────

// TTL presigned URL для вложений в истории чата.
// 1 час — достаточно для просмотра переписки за одну сессию.
const ATTACHMENT_URL_TTL_SECONDS = 60 * 60;

// ── Select shapes ─────────────────────────────────────────────────────────────

const chatSelect = {
  id:        true,
  userId:    true,
  createdAt: true,
  user: {
    select: {
      name:    true,
      surname: true,
      email:   true,
    }
  },

} satisfies Prisma.SupportChatSelect;

// url убран из select — колонки нет в схеме
const attachmentSelect = {
  id:       true,
  name:     true,
  key:      true,
  mimeType: true,
  size:     true,
} satisfies Prisma.SupportAttachmentSelect;

const messageSelect = {
  id:         true,
  chatId:     true,
  senderId:   true,
  senderRole: true,
  text:       true,
  createdAt:  true,
  attachments: { select: attachmentSelect },
} satisfies Prisma.SupportMessageSelect;

type ChatRow       = Prisma.SupportChatGetPayload<{ select: typeof chatSelect }>;
type MessageRow    = Prisma.SupportMessageGetPayload<{ select: typeof messageSelect }>;
type AttachmentRow = Prisma.SupportAttachmentGetPayload<{ select: typeof attachmentSelect }>;

// ── Repository ────────────────────────────────────────────────────────────────

export class PrismaSupportChatRepository implements ISupportChatRepository {
  constructor(
    private readonly prisma:      PrismaClient,
    private readonly fileStorage: IFileStorageFactory,
  ) {}

  async findOrCreateChat(userId: string): Promise<SupportChatDto> {
    const chat = await this.prisma.supportChat.upsert({
      where:  { userId },
      create: { userId },
      update: {},
      select: chatSelect,
    });
    return this.chatToDto(chat);
  }

  async createMessage(input: CreateMessageInput): Promise<SupportMessageDto> {
    const message = await this.prisma.supportMessage.create({
      data: {
        chatId:     input.chatId,
        senderId:   input.senderId,
        senderRole: input.senderRole,
        text:       input.text?.trim() ?? null,
        attachments: {
          create: (input.attachments ?? []).map((a) => ({
            name:     a.name,
            key:      a.key,
            mimeType: a.mimeType,
            size:     a.size,
          })),
        },
      },
      select: messageSelect,
    });
 
    return this.messageToDto(message);
  }

  async getMessages(chatId: string, limit = 50, before?: Date): Promise<SupportMessageDto[]> {
    const messages = await this.prisma.supportMessage.findMany({
      where:   { chatId, ...(before ? { createdAt: { lt: before } } : {}) },
      orderBy: { createdAt: "desc" },
      take:    limit,
      select:  messageSelect,
    });

    // .reverse() - Конвертируем все сообщения обратно в asc
    return Promise.all(messages.reverse().map((m: any) => this.messageToDto(m)));
  }

  async findChatById(chatId: string): Promise<SupportChatDto | null> {
  const chat = await this.prisma.supportChat.findUnique({
    where:  { id: chatId },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      user: {  // добавляем join
        select: {
          name: true,
          surname: true,
          email: true,
        }
      }
    },
  });
  return chat ? this.chatToDto(chat) : null;
  }

  async findAllChats(): Promise<SupportChatDto[]> {
    const chats = await this.prisma.supportChat.findMany({
      orderBy: { createdAt: "desc" },
      select: chatSelect,
    });
    return chats.map((c: any) => this.chatToDto(c));
  }

  // ── Mappers ───────────────────────────────────────────────────────────────

  private chatToDto(c: ChatRow): SupportChatDto {
    return {
      id:        c.id,
      userId:    c.userId,
      createdAt: c.createdAt,
      user: c.user ? {           
        name: c.user.name,
        surname: c.user.surname,
        email: c.user.email,
      } : undefined,
    };
  }


  private async messageToDto(m: MessageRow): Promise<SupportMessageDto> {
    const attachments = await this.resolveAttachments(m.attachments);
    return {
      id:          m.id,
      chatId:      m.chatId,
      senderId:    m.senderId,
      senderRole:  m.senderRole,
      text:        m.text,
      attachments,
      createdAt:   m.createdAt,
    };
  }

  // Генерируем presigned URL для каждого вложения параллельно.
  // Если fileStorage.getPresignedDownloadUrl упадёт для одного файла —
  // не ломаем всё сообщение: подставляем пустую строку и логируем.
   private async resolveAttachments(rows: AttachmentRow[]): Promise<SupportAttachmentDto[]> {
    return Promise.all(
      rows.map(async (a) => {
        let url = "";
        try {
          url = await this.fileStorage.getPresignedDownloadUrl(a.key, ATTACHMENT_URL_TTL_SECONDS);
          console.log("DOWNLOAD URL", url);
        } catch (err) {
          console.error(`[SupportChatRepo] presign failed for key=${a.key}:`, err);
        }
        return { id: a.id, name: a.name, key: a.key, mimeType: a.mimeType, size: a.size, url };
      }),
    );
  }


}