import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectUserId } from '@entities/user/model/selectors';
import { tokenManager } from '@shared/lib/TokenManager';
import { io, Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
  id:         string;
  senderId:   string;
  senderRole: string;
  text:       string | null;
  fileKey:    string | null;
  createdAt:  string;
}

export const LessonChat = ({ lessonId }: { lessonId: string }) => {
  const { t } = useTranslation('lesson');
  const userId    = useSelector(selectUserId);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText]         = useState('');

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
      withCredentials: true,
      auth: { token: tokenManager.get() },
    });
    socketRef.current = socket;

    socket.emit('lesson:chat:join', { lessonId });

    socket.on('lesson:chat:history', (history: ChatMessage[]) => {
      setMessages(history);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    socket.on('lesson:message:new', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    return () => { socket.disconnect(); };
  }, [lessonId]);

  const send = () => {
    if (!text.trim()) return;
    socketRef.current?.emit('lesson:message', { lessonId, text: text.trim() }, (response: any) => {
      if (response?.error) {
        console.error(response.error);
      }
});
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.map((msg) => {
          const isOwn = msg.senderId === userId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3 py-2 text-sm rounded-2xl
                  ${isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-slate-700 text-slate-100 rounded-bl-sm'}`}
              >
                {msg.text && (
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                )}
                {msg.fileKey && (
                  <a
                    href={msg.fileKey}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-xs underline underline-offset-2 block mt-1
                      ${isOwn ? 'text-blue-200' : 'text-slate-400'}`}
                  >
                    📎 {t('chat.file')}
                  </a>
                )}
                <p className={`text-xs mt-1 text-right
                  ${isOwn ? 'text-blue-200' : 'text-slate-500'}`}>
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
      <div className="px-3 py-3 border-t border-slate-800 flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={t('chat.placeholder')}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5
            text-sm text-white placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          aria-label="Send"
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40
            text-white px-3 py-2.5 rounded-xl transition text-sm font-medium"
        >
          ↑
        </button>
      </div>
    </div>
  );
};