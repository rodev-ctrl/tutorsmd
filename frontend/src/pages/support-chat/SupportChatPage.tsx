import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUserId } from '@entities/user/model/selectors';
import { tokenManager } from '@shared/lib/TokenManager';
import { useGetMyChatQuery } from '@shared/api/supportApi';
import { Layout } from '@widgets/layout/ui/Layout';
import { Spinner } from '@shared/index';
import { io, Socket } from 'socket.io-client';
import type { SupportMessage, SupportAttachment } from '@shared/api/supportApi';


interface PendingFile {
  file:     File;
  status:   'pending' | 'uploading' | 'done' | 'error';
  key?:     string;
  name?:    string;
  progress: number;
}

// ─── Attachment viewer ────────────────────────────────────────
const AttachmentView = ({ attachment }: { attachment: SupportAttachment }) => {
  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attachment.name) ||
    attachment.mimeType?.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf' ||
    /\.pdf$/i.test(attachment.name);
  const url = attachment.url || attachment.key;

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block max-w-[200px]">
        <img src={url} alt={attachment.name}
          className="max-w-[200px] rounded-lg object-cover" loading="lazy" />
        <p className="text-xs mt-1 truncate opacity-60">{attachment.name}</p>
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs underline opacity-80 hover:opacity-100">
      <span>{isPdf ? '📄' : '📎'}</span>
      <span className="truncate max-w-[160px]">{attachment.name}</span>
      {attachment.size && (
        <span className="opacity-60">({Math.round(attachment.size / 1024)} KB)</span>
      )}
    </a>
  );
};

// ─── Main component ───────────────────────────────────────────
export default function SupportChatPage() {
  const userId    = useSelector(selectUserId);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: chat, isLoading } = useGetMyChatQuery();
  const [messages, setMessages]   = useState<SupportMessage[]>([]);
  const [text, setText]           = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ─── Заполняем историю из БД ───────────────────────────────
  useEffect(() => {
    if (chat?.messages) {
      setMessages(chat.messages);
      setHasMore(chat.messages.length >= 50);
    }
  }, [chat]);

  // ─── Socket.IO ─────────────────────────────────────────────
  useEffect(() => {
    if (!chat?.id) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
      withCredentials: true,
      auth: { token: tokenManager.get() },
    });
    socketRef.current = socket;

    // join — сервер вернёт историю через support:history
    socket.emit('support:join', { }, (res: any) => {
      if (!res?.ok) console.error('support:join failed', res);
    });

    socket.on('support:history', (msgs: SupportMessage[]) => {
      setMessages(msgs);
    });

    socket.on('support:message', (msg: SupportMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    return () => { socket.disconnect(); };
  }, [chat?.id]);

  // ─── Load more (cursor pagination) ────────────────────────
  const loadMore = useCallback(async () => {
    if (!chat?.id || !messages.length || loadingMore) return;
    setLoadingMore(true);
    const oldest = messages[0];
    socketRef.current?.emit(
      'support:history_more',
      { chatId: chat.id, limit: 30, before: oldest.createdAt },
      (res: any) => {
        if (res?.ok) {
          setMessages((prev) => [...res.messages, ...prev]);
          setHasMore(res.hasMore);
        }
        setLoadingMore(false);
      },
    );
  }, [chat?.id, messages, loadingMore]);

  // ─── File selection ─────────────────────────────────────────
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newPending: PendingFile[] = files.map((f) => ({
      file: f, status: 'pending', progress: 0,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    e.target.value = '';
  };

  const removePending = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── Upload file via presigned URL ──────────────────────────
  // Flow: emit support:presign → получаем uploadUrl + key → PUT в R2
  const uploadFile = (
    pending: PendingFile,
    idx: number,
  ): Promise<{ key: string; name: string; mimeType: string; size: number }> => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit(
        'support:presign',
        { fileName: pending.file.name, mimeType: pending.file.type, size: pending.file.size },
        async (res: any) => {
          if (!res?.ok) {
            setPendingFiles((prev) =>
              prev.map((p, i) => i === idx ? { ...p, status: 'error' } : p));
            return reject(new Error(res?.error ?? 'Presign failed'));
          }

          const { uploadUrl, key, name } = res;

          setPendingFiles((prev) =>
            prev.map((p, i) => i === idx ? { ...p, status: 'uploading' } : p));

          try {
            // Прямой PUT в R2 через presigned URL
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', pending.file.type);

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setPendingFiles((prev) =>
                  prev.map((p, i) => i === idx ? { ...p, progress: pct } : p));
              }
            };

            xhr.onload = () => {
              if (xhr.status === 200) {
                setPendingFiles((prev) =>
                  prev.map((p, i) => i === idx ? { ...p, status: 'done', key, name } : p));
                resolve({
                  key,
                  name: name ?? pending.file.name,
                  mimeType: pending.file.type,
                  size: pending.file.size,
                });
              } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
              }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(pending.file);
          } catch (err) {
            setPendingFiles((prev) =>
              prev.map((p, i) => i === idx ? { ...p, status: 'error' } : p));
            reject(err);
          }
        },
      );
    });
  };

  // ─── Send message ───────────────────────────────────────────
  const send = async () => {
    if ((!text.trim() && !pendingFiles.length) || sending || !chat?.id) return;
    setSending(true);

    try {
      // 1. Загружаем все файлы параллельно
      const uploadedFiles = pendingFiles.length
        ? await Promise.all(pendingFiles.map((p, i) => uploadFile(p, i)))
        : [];

      // 2. Отправляем сообщение с текстом + metadata файлов
      socketRef.current?.emit(
        'support:message',
        {
          text:  text.trim() || undefined,
          files: uploadedFiles.length ? uploadedFiles : undefined,
        },
        (res: any) => {
          if (!res?.ok) console.error('send failed', res);
        },
      );

      setText('');
      setPendingFiles([]);
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  if (isLoading) return <Layout><Spinner /></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col"
        style={{ height: 'calc(100vh - 80px)' }}>

        {/* Header */}
        <div className="bg-white rounded-t-2xl border border-gray-100 px-5 py-4 flex-shrink-0">
          <h1 className="font-semibold text-gray-900">Support</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Wir antworten in der Regel innerhalb von 24 Stunden.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white border-x border-gray-100 px-4 py-3 space-y-3">

          {/* Load more */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                {loadingMore ? 'Laden...' : 'Ältere Nachrichten laden'}
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Schreiben Sie uns — wir helfen Ihnen gerne!
            </p>
          )}

          {messages.map((msg) => {
            const isOwn   = msg.senderId === userId;
            const isAdmin = msg.senderRole === 'admin';
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm space-y-1
                  ${isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : isAdmin
                      ? 'bg-orange-50 text-gray-900 border border-orange-200 rounded-bl-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>

                  {!isOwn && (
                    <p className="text-xs font-medium opacity-60">
                      {isAdmin ? 'Support' : msg.senderRole}
                    </p>
                  )}

                  {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                  {msg.attachments?.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {msg.attachments.map((a) => (
                        <AttachmentView key={a.id} attachment={a} />
                      ))}
                    </div>
                  )}

                  <p className="text-xs opacity-40 text-right">
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

        {/* Pending files preview */}
        {pendingFiles.length > 0 && (
          <div className="bg-white border-x border-gray-100 px-4 py-2 flex flex-wrap gap-2">
            {pendingFiles.map((pf, i) => (
              <div key={i}
                className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1 text-xs">
                <span className="truncate max-w-[120px]">{pf.file.name}</span>
                {pf.status === 'uploading' && (
                  <span className="text-blue-600">{pf.progress}%</span>
                )}
                {pf.status === 'done' && <span className="text-green-600">✓</span>}
                {pf.status === 'error' && <span className="text-red-500">✗</span>}
                {pf.status === 'pending' && (
                  <button onClick={() => removePending(i)}
                    className="text-gray-400 hover:text-gray-600 ml-0.5">✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="bg-white rounded-b-2xl border border-gray-100 px-4 py-3
          flex items-end gap-2 flex-shrink-0">

          {/* File button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100
              transition flex-shrink-0"
            title="Datei anhängen"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={onFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          {/* Text input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Nachricht..."
            rows={1}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none
              max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />

          {/* Send button */}
          <button
            onClick={send}
            disabled={(!text.trim() && !pendingFiles.length) || sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
              text-white px-4 py-2 rounded-xl transition text-sm font-medium flex-shrink-0"
          >
            {sending ? '...' : '↑'}
          </button>
        </div>

      </div>
    </Layout>
  );
}
