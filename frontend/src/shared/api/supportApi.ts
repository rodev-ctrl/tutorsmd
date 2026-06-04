import { baseApi } from './baseApi';

export interface SupportMessage {
  id:         string;
  chatId:     string;
  senderId:   string;
  senderRole: 'client' | 'tutor' | 'admin';
  text:       string | null;
  createdAt:  string;
  attachments: SupportAttachment[];
}

export interface SupportAttachment {
  id:       string;
  name:     string;
  key:      string;
  mimeType: string;
  size:     number;
  url:      string;
}

export interface SupportChat {
  id:        string;
  userId:    string;
  createdAt: string;
  messages:  SupportMessage[];
  user?: {
    name:    string;
    surname: string;
    email:   string;
    avatarUrl: string | null;
  };
}

export interface JoinSupportChatResponse {
  chat:     SupportChat;     
  messages: SupportMessage[]; 
}

export const supportApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // GET /support/chat — текущий юзер получает свой чат (создаётся автоматически)
       getMyChat: build.query<SupportChat, void>({
      query: () => '/support/chat',
      transformResponse: (response: { chat: any; messages: SupportMessage[] }) => ({
        ...response.chat,
        messages: response.messages || [],
      }),
      providesTags: ['Support'],
    }),

    // GET /support/chats — admin: список всех чатов
    getAllChats: build.query<{ chats: SupportChat[] }, void>({
      query: () => '/support/chats',
      providesTags: ['Support'],
    }),

    // GET /support/chats/:chatId — admin: конкретный чат
    getChatById: build.query<SupportChat, string>({
      query: (chatId) => `/support/chats/${chatId}`,
      providesTags: (_r, _e, id) => [{ type: 'Support', id }],
    }),

  }),
});

export const {
  useGetMyChatQuery,
  useGetAllChatsQuery,
  useGetChatByIdQuery,
} = supportApi;
