// Admin видит все чаты — выбирает чат — отвечает

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectUserId } from '@entities/user/model/selectors';
import { tokenManager } from '@shared/lib/TokenManager';
import {
  useGetAllChatsQuery,
  useGetChatByIdQuery,
  type SupportMessage,
} from '@shared/api/supportApi';
import { Layout } from '@widgets/layout/ui/Layout';
import { Spinner } from '@shared/index';
import { io, Socket } from 'socket.io-client';

export default function AdminMessagesPage() {
  const userId = useSelector(selectUserId);
  const [chatId, setChatId] = useState<string | null>(null);

  const { data: allChats, isLoading: chatsLoading } = useGetAllChatsQuery();
  const { data: activeChat, isLoading: chatLoading } = useGetChatByIdQuery(
    chatId ?? '', { skip: !chatId },
  );

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText]         = useState('');

  useEffect(() => {
    if (activeChat?.messages) setMessages(activeChat.messages);
  }, [activeChat]);

  useEffect(() => {
    if (!chatId || !activeChat?.userId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
      withCredentials: true,
      auth: { token: tokenManager.get() },
    });
    socketRef.current = socket;

    socket.emit(
    'support:admin_join',
    { targetUserId: activeChat.userId },
    (res: any) => {
      console.log('ADMIN JOIN RESPONSE:', res);

      if (!res?.ok) {
        console.error('admin join failed', res);
      }
    }
  );

  socket.on('support:history', (msgs: SupportMessage[]) => {
    setMessages(msgs);
  });

    socket.on('support:message', (msg: SupportMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    return () => { socket.disconnect(); };
  }, [chatId, activeChat?.userId]);

  const send = () => {
    if (!text.trim() || !chatId) return;
    socketRef.current?.emit(
      'support:message', 
      { text: text.trim() },
      (res: any) => {
      console.log('ADMIN SEND RESPONSE:', res);

      if (!res?.ok) {
        console.error('admin send failed', res);
        return;
      }

      setText('');
    }
    
    );
    setText('');
  };

  const chats = allChats?.chats ?? [];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Support-Nachrichten</h1>

        <div className="flex gap-4 h-[calc(100vh-180px)]">

          {/* Sidebar — список чатов */}
          <aside className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100
            overflow-y-auto">
            {chatsLoading ? (
              <Spinner />
            ) : chats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center p-6">Keine Chats</p>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setChatId(chat.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50
                    hover:bg-gray-50 transition
                    ${chatId === chat.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {chat.user
                      ? `${chat.user.name} ${chat.user.surname}`
                      : chat.userId.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {chat.user?.email ?? ''}
                  </p>
                  {chat.messages.at(-1)?.text && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {chat.messages.at(-1)!.text}
                    </p>
                  )}
                </button>
              ))
            )}
          </aside>

          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100
            overflow-hidden min-w-0">

            {!chatId ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Chat auswählen</p>
              </div>
            ) : chatLoading ? (
              <div className="flex-1 flex items-center justify-center"><Spinner /></div>
            ) : (
              <>
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {activeChat?.user
                      ? `${activeChat.user.name} ${activeChat.user.surname}`
                      : chatId.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-400">{activeChat?.user?.email}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.map((msg) => {
                    const isOwn   = msg.senderId === userId;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm
                          ${isOwn
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1 opacity-60">
                              {msg.senderRole}
                            </p>
                          )}
                          {msg.text && <p>{msg.text}</p>}
                          <p className="text-xs mt-1 opacity-40 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString('de-DE', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Antwort schreiben..."
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    onClick={send}
                    disabled={!text.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
                      text-white px-4 py-2 rounded-xl transition text-sm font-medium"
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
