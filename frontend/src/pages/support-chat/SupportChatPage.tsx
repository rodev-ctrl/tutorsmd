import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUserId } from '@entities/user/model/selectors';
import { tokenManager } from '@shared/lib/TokenManager';
import { useGetMyChatQuery } from '@shared/api/supportApi';
import { Layout } from '@widgets/layout/ui/Layout';
import { Spinner } from '@shared/index';
import { io, Socket } from 'socket.io-client';
import type { SupportMessage, SupportAttachment } from '@shared/api/supportApi';
import { useTranslation } from 'react-i18next';

interface PendingFile {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  key?: string;
  name?: string;
  progress: number;
}

const AttachmentView = ({ attachment, isOwn }: { attachment: SupportAttachment; isOwn: boolean }) => {
  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attachment.name) ||
    attachment.mimeType?.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf' || /\.pdf$/i.test(attachment.name);
  const url = attachment.url || attachment.key;

  console.log(attachment);

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block max-w-[200px]">
        <img src={url} alt={attachment.name} className="max-w-[200px] rounded-xl object-cover" loading="lazy" />
        <p className={`text-xs mt-1 truncate ${isOwn ? 'opacity-70' : 'text-slate-400'}`}>{attachment.name}</p>
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className={`flex items-center gap-2 text-xs underline underline-offset-2 ${isOwn ? 'text-blue-100 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
      <span>{isPdf ? '📄' : '📎'}</span>
      <span className="truncate max-w-[160px]">{attachment.name}</span>
      {attachment.size && <span className="opacity-60">({Math.round(attachment.size / 1024)} KB)</span>}
    </a>
  );
};

export default function SupportChatPage() {
  const userId = useSelector(selectUserId);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: chat, isLoading } = useGetMyChatQuery();


  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const { t } = useTranslation('support');

  // Debug
  useEffect(() => {
    console.log('[SupportChat Debug] extracted chat:', chat);
  }, [chat]);

  // Инициализация сообщений
  useEffect(() => {
    if (chat?.messages?.length) {
      setMessages(chat.messages);
      setHasMore(chat.messages.length >= 50);
    }
  }, [chat]);

  // Socket connection
  useEffect(() => {
    if (!chat?.id) {
      console.log('[SupportChat] Waiting for chat data...');
      return;
    }

    console.log(`[SupportChat] Chat ready (id=${chat.id}) → initializing socket`);

    const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
      withCredentials: true,
      auth: { token: tokenManager.get() },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    const handleConnect = () => {
      console.log(`[SupportChat] Socket connected → joining chat ${chat.id}`);
      socket.emit('support:join', {}, (res: any) => {
        console.log('JOIN RESPONSE:', res);
        if (res?.ok) setIsJoined(true);
      });
    };

    socket.on('connect', handleConnect);

    socket.on('support:history', (msgs: SupportMessage[]) => {
      console.log(`[SupportChat] Received history: ${msgs.length} messages`);
      setMessages(msgs);
      setHasMore(msgs.length >= 50);
    });

    socket.on('support:message', (msg: SupportMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    });

    socket.emit('support:join', {}, (res: any) => {
      console.log('JOIN RESPONSE (initial):', res);
      if (res?.ok) setIsJoined(true);
    });

    return () => {
      socket.disconnect();
      setIsJoined(false);
    };
  }, [chat?.id]);

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
      }
    );
  }, [chat?.id, messages, loadingMore]);


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

  const uploadFile = (
  pending: PendingFile,
  idx: number,
): Promise<{ key: string; name: string; mimeType: string; size: number }> => {
  return new Promise((resolve, reject) => {
    socketRef.current?.emit(
      'support:presign',
      { 
        fileName: pending.file.name, 
        mimeType: pending.file.type, 
        size: pending.file.size 
      },
      async (res: any) => {
        console.log('[Presign] Response:', res);

        if (!res?.ok) {
          console.error('[Presign] Failed:', res?.error);
          setPendingFiles(prev => prev.map((p, i) => i === idx ? { ...p, status: 'error' } : p));
          return reject(new Error(res?.error || 'Presign failed'));
        }

        const { uploadUrl, key, name } = res;
        console.log('[Upload] Starting to URL:', uploadUrl.substring(0, 100) + '...');

        try {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', pending.file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setPendingFiles(prev => 
                prev.map((p, i) => i === idx ? { ...p, progress: pct } : p)
              );
            }
          };

          xhr.onload = () => {
            console.log('[Upload] Status:', xhr.status, xhr.statusText);
            if (xhr.status === 200 || xhr.status === 204) {
              setPendingFiles(prev => 
                prev.map((p, i) => i === idx ? { ...p, status: 'done', key, name } : p)
              );
              resolve({ 
                key, 
                name: name ?? pending.file.name, 
                mimeType: pending.file.type, 
                size: pending.file.size 
              });
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = (e) => {
            console.error('[Upload] Network Error:', e);
            reject(new Error('Network error - check CORS or network'));
          };

          xhr.ontimeout = () => reject(new Error('Upload timeout'));

          xhr.send(pending.file);
        } catch (err) {
          console.error('[Upload] Exception:', err);
          reject(err);
        }
      }
    );
  });
};

  const send = async () => {
    const socket = socketRef.current;
    if (!socket?.connected || !isJoined || !chat?.id) {
      console.error('Cannot send: socket or chat not ready', { connected: socket?.connected, isJoined });
      return;
    }

    if ((!text.trim() && !pendingFiles.length) || sending) return;

    setSending(true);

    try {
      const uploadedFiles = pendingFiles.length
        ? await Promise.all(pendingFiles.map((p, i) => uploadFile(p, i)))
        : [];

      socketRef.current?.emit(
        'support:message',
        {
          text:  text.trim() || undefined,
          files: uploadedFiles.length ? uploadedFiles : undefined,
        },
        (res: any) => {
          if (res?.ok) {
            setText('');
            setPendingFiles([]);
          } else {
            console.error('send failed', res);
          }

      
        },
      );

    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  if (isLoading) return <Layout><Spinner /></Layout>;

  const isReady = chat?.id && socketRef.current?.connected && isJoined;


  return (
    <Layout>
      <div
        className="max-w-2xl mx-auto px-4 py-8 flex flex-col"
        style={{ height: 'calc(100vh - 80px)' }}
      >

        {/* Header */}
        <div className="bg-white rounded-t-3xl border border-slate-200 border-b-0 px-6 py-4 flex-shrink-0">
          <h1 className="text-sm font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('subtitle')}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-50 border-x border-slate-200 px-4 py-4 space-y-3">

          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50 transition"
              >
                {loadingMore ? t('loading') : t('loadMore')}
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-slate-400 text-center py-8">
                {t('emptyState')}
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isOwn   = msg.senderId === userId;
            const isAdmin = msg.senderRole === 'admin';

            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 text-sm space-y-1.5
                    ${isOwn
                      ? 'bg-blue-600 text-white rounded-3xl rounded-br-sm'
                      : isAdmin
                        ? 'bg-white text-slate-900 border border-orange-200 rounded-3xl rounded-bl-sm'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-3xl rounded-bl-sm'}`}
                >
                  {!isOwn && (
                    <p className={`text-xs font-semibold ${isAdmin ? 'text-orange-500' : 'text-slate-400'}`}>
                      {isAdmin ? t('senderLabel.support') : msg.senderRole}
                    </p>
                  )}

                  {msg.text && (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                  )}

                  {msg.attachments?.length > 0 && (
                    <div className="space-y-1.5 mt-1">
                      {msg.attachments.map((a) => (
                        <AttachmentView key={a.id} attachment={a} isOwn={isOwn} />
                      ))}
                    </div>
                  )}

                  <p className={`text-xs text-right ${isOwn ? 'text-blue-200' : 'text-slate-300'}`}>
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
          <div className="bg-white border-x border-slate-200 px-4 py-2.5 flex flex-wrap gap-2">
            {pendingFiles.map((pf, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-3 py-1.5 text-xs"
              >
                <span className="truncate max-w-[120px] text-slate-700">{pf.file.name}</span>
                {pf.status === 'uploading' && (
                  <span className="text-blue-600 font-medium">{pf.progress}%</span>
                )}
                {pf.status === 'done' && (
                  <span className="text-green-600">✓</span>
                )}
                {pf.status === 'error' && (
                  <span className="text-red-500">{t('file.error')}</span>
                )}
                {pf.status === 'pending' && (
                  <button
                    onClick={() => removePending(i)}
                    className="text-slate-400 hover:text-slate-600 ml-0.5 transition"
                    aria-label="Datei entfernen"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="bg-white rounded-b-3xl border border-slate-200 border-t border-t-slate-200
          px-4 py-3 flex items-end gap-2 flex-shrink-0">

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100
              transition flex-shrink-0"
            title={t('input.attachTitle')}
            aria-label={t('input.attachTitle')}
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

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={t('input.placeholder')}
            rows={1}
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm
              focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none
              max-h-32 overflow-y-auto text-slate-900 placeholder:text-slate-400"
            style={{ minHeight: '42px' }}
          />

          <button
            onClick={send}
            disabled={!isReady || (!text.trim() && !pendingFiles.length) || sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40
              text-white px-4 py-2.5 rounded-xl transition text-sm font-medium flex-shrink-0"
          >
            {sending ? t('input.sending') : t('input.send')}
          </button>
        </div>

      </div>
    </Layout>
  );
}

