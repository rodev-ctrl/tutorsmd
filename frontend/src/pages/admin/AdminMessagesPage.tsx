import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectUserId } from '@entities/user/model/selectors';
import { tokenManager } from '@shared/lib/TokenManager';
import { useGetAllChatsQuery, useGetChatByIdQuery, type SupportMessage } from '@shared/api/supportApi';
import { Layout } from '@widgets/layout/ui/Layout';
import { Spinner } from '@shared/index';
import { io, Socket } from 'socket.io-client';
import { AttachmentView } from '@pages/support-chat/AttachmentsView';
import { useTranslation } from 'react-i18next';

export default function AdminMessagesPage() {
  const userId = useSelector(selectUserId);
  const [chatId, setChatId] = useState<string | null>(null);

  const { data: allChatsResponse, isLoading: chatsLoading } = useGetAllChatsQuery();
  const { data: activeChat, isLoading: chatLoading } = useGetChatByIdQuery(chatId ?? '', { 
    skip: !chatId 
  });

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const chats = Array.isArray(allChatsResponse?.chats) ? allChatsResponse.chats : [];

  console.log('[Admin] allChatsResponse:', allChatsResponse);
  console.log('[Admin] activeChat:', activeChat);

  const { t } = useTranslation('support');

  // Socket setup
  useEffect(() => {
    if (!chatId || !activeChat?.userId) {
      setIsJoined(false);
      setMessages([]);
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
      withCredentials: true,
      auth: { token: tokenManager.get() },
    });
    socketRef.current = socket;

    console.log(`[Admin] Joining chat ${chatId} with userId ${activeChat.userId}`);

    socket.emit('support:admin_join', { 
      targetUserId: activeChat.userId   // теперь точно UUID
    }, (res: any) => {
      console.log('ADMIN JOIN RESPONSE:', res);
      if (res?.ok) setIsJoined(true);
    });

    socket.on('support:history', (msgs: SupportMessage[]) => {
      console.log(`[Admin] Received history: ${msgs.length} messages`);
      setMessages(msgs);
    });

    socket.on('support:message', (msg: SupportMessage) => {
      setMessages(prev => [...prev, msg]);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => {
      socket.disconnect();
      setIsJoined(false);
      setMessages([]);
    };
  }, [chatId, activeChat?.userId]);

  const send = () => {
    if (!text.trim() || !socketRef.current || !isJoined) return;

    socketRef.current.emit('support:message', { text: text.trim() }, (res: any) => {
      if (res?.ok) setText('');
      else console.error('Admin send failed:', res);
    });
  };




  return (
  <Layout>
    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-6">
        {t('adminSupport.title')}
      </h1>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-140px)] md:h-[calc(100vh-180px)]">

        {/* CHAT LIST */}
        <aside
          className={`
            ${chatId ? 'hidden md:flex' : 'flex'}
            flex-col
            w-full md:w-80
            lg:w-96
            flex-shrink-0
            bg-white
            rounded-2xl
            border
            border-gray-100
            overflow-hidden
          `}
        >
          <div className="px-4 py-4 border-b border-gray-100 bg-white">
            <h2 className="font-semibold text-gray-900">
              {t('adminSupport.chatList')}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : chats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center p-6">
                {t('adminSupport.empty')}
              </p>
            ) : (
              chats.map((chat: any) => (
                <button
                  key={chat.id}
                  onClick={() => setChatId(chat.id)}
                  className={`
                    w-full
                    text-left
                    px-4
                    py-4
                    border-b
                    border-gray-50
                    transition
                    hover:bg-gray-50

                    ${
                      chatId === chat.id
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : ''
                    }
                  `}
                >
                  <p className="font-medium text-gray-900 truncate">
                    {chat.user
                      ? `${chat.user.name} ${chat.user.surname}`
                      : chat.userId?.slice(0, 8)}
                  </p>

                  <p className="text-xs text-gray-400 truncate mt-1">
                    {chat.user?.email}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* CHAT WINDOW */}
        <div
          className={`
            ${!chatId ? 'hidden md:flex' : 'flex'}
            flex-1
            flex-col
            bg-white
            rounded-2xl
            border
            border-gray-100
            overflow-hidden
            min-w-0
          `}
        >
          {!chatId ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400 text-sm">
                {t('adminSupport.selectChat')}
              </p>
            </div>
          ) : chatLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">

                <button
                  onClick={() => setChatId(null)}
                  className="
                    md:hidden
                    h-9
                    w-9
                    flex
                    items-center
                    justify-center
                    rounded-lg
                    hover:bg-gray-100
                    transition
                  "
                >
                  ←
                </button>

                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {activeChat?.user
                      ? `${activeChat.user.name} ${activeChat.user.surname}`
                      : chatId}
                  </p>

                  <p className="text-xs text-gray-400 truncate">
                    {activeChat?.user?.email}
                  </p>
                </div>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 space-y-3">

 
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-center py-12">
                    {t('adminSupport.noMessages')}
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === userId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isOwn
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`
                            max-w-[85%] md:max-w-[70%]
                            px-4
                            py-3
                            rounded-2xl
                            text-sm

                            ${
                              isOwn
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                            }
                          `}
                        >
                          {!isOwn && (
                            <p className="text-xs opacity-60 mb-1">
                              {msg.senderRole}
                            </p>
                          )}

                          {msg.text && (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {msg.text}
                            </p>
                          )}

                          {msg.attachments?.length > 0 && (
                            <div className="space-y-2 mt-2">
                              {msg.attachments.map((a) => (
                                <AttachmentView
                                  key={a.id}
                                  attachment={a}
                                  isOwn={isOwn}
                                />
                              ))}
                            </div>
                          )}

                          <p className="text-xs mt-2 opacity-50 text-right">
                            {new Date(
                              msg.createdAt
                            ).toLocaleTimeString(
                              'de-DE',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={bottomRef} />
              </div>

              {/* INPUT */}
              <div className="border-t border-gray-100 p-3 md:p-4 flex gap-2 flex-shrink-0">

                <input
                  value={text}
                  onChange={(e) =>
                    setText(e.target.value)
                  }
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    send()
                  }

                 
                  placeholder= {t('adminSupport.replyPlaceholder')}
                  className="
                    flex-1
                    border
                    border-gray-300
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-300
                  "
                />

                <button
                  onClick={send}
                  disabled={
                    !text.trim() || !isJoined
                  }
                  className="
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:bg-gray-300
                    text-white
                    px-5
                    py-3
                    rounded-xl
                    transition
                    text-sm
                    font-medium
                    shrink-0
                  "
                >
                  ↑
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </Layout>

  );
}