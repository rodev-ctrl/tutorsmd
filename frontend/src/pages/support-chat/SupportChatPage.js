import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUserId } from '@entities/user/model/selectors';
import { tokenManager } from '@shared/lib/TokenManager';
import { useGetMyChatQuery } from '@shared/api/supportApi';
import { Layout } from '@widgets/layout/ui/Layout';
import { Spinner } from '@shared/index';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
// ─── Attachment viewer ────────────────────────────────────────
const AttachmentView = ({ attachment, isOwn }) => {
    const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attachment.name) ||
        attachment.mimeType?.startsWith('image/');
    const isPdf = attachment.mimeType === 'application/pdf' || /\.pdf$/i.test(attachment.name);
    const url = attachment.url || attachment.key;
    if (isImage) {
        return (_jsxs("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: "block max-w-[200px]", children: [_jsx("img", { src: url, alt: attachment.name, className: "max-w-[200px] rounded-xl object-cover", loading: "lazy" }), _jsx("p", { className: `text-xs mt-1 truncate ${isOwn ? 'opacity-70' : 'text-slate-400'}`, children: attachment.name })] }));
    }
    return (_jsxs("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: `flex items-center gap-2 text-xs underline underline-offset-2
        ${isOwn ? 'text-blue-100 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`, children: [_jsx("span", { children: isPdf ? '📄' : '📎' }), _jsx("span", { className: "truncate max-w-[160px]", children: attachment.name }), attachment.size && (_jsxs("span", { className: "opacity-60", children: ["(", Math.round(attachment.size / 1024), " KB)"] }))] }));
};
// ─── Main component ───────────────────────────────────────────
export default function SupportChatPage() {
    const userId = useSelector(selectUserId);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const { data: chat, isLoading } = useGetMyChatQuery();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [pendingFiles, setPendingFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const { t } = useTranslation('support');
    useEffect(() => {
        if (chat?.messages) {
            setMessages(chat.messages);
            setHasMore(chat.messages.length >= 50);
        }
    }, [chat]);
    useEffect(() => {
        if (!chat?.id)
            return;
        const socket = io(import.meta.env.VITE_SOCKET_URL, {
            withCredentials: true,
            auth: { token: tokenManager.get() },
        });
        socketRef.current = socket;
        socket.emit('support:join', {}, (res) => {
            if (!res?.ok)
                console.error('support:join failed', res);
        });
        socket.on('support:history', (msgs) => {
            setMessages(msgs);
        });
        socket.on('support:message', (msg) => {
            setMessages((prev) => [...prev, msg]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        });
        return () => { socket.disconnect(); };
    }, [chat?.id]);
    const loadMore = useCallback(async () => {
        if (!chat?.id || !messages.length || loadingMore)
            return;
        setLoadingMore(true);
        const oldest = messages[0];
        socketRef.current?.emit('support:history_more', { chatId: chat.id, limit: 30, before: oldest.createdAt }, (res) => {
            if (res?.ok) {
                setMessages((prev) => [...res.messages, ...prev]);
                setHasMore(res.hasMore);
            }
            setLoadingMore(false);
        });
    }, [chat?.id, messages, loadingMore]);
    const onFileChange = (e) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length)
            return;
        const newPending = files.map((f) => ({
            file: f, status: 'pending', progress: 0,
        }));
        setPendingFiles((prev) => [...prev, ...newPending]);
        e.target.value = '';
    };
    const removePending = (idx) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
    };
    const uploadFile = (pending, idx) => {
        return new Promise((resolve, reject) => {
            socketRef.current?.emit('support:presign', { fileName: pending.file.name, mimeType: pending.file.type, size: pending.file.size }, async (res) => {
                if (!res?.ok) {
                    setPendingFiles((prev) => prev.map((p, i) => i === idx ? { ...p, status: 'error' } : p));
                    return reject(new Error(res?.error ?? 'Presign failed'));
                }
                const { uploadUrl, key, name } = res;
                setPendingFiles((prev) => prev.map((p, i) => i === idx ? { ...p, status: 'uploading' } : p));
                try {
                    // XML, а не fetch(), потому что только XMLHttpRequest поддерживает partial upload, а значит и отслеживание прогресс загрузки.
                    const xhr = new XMLHttpRequest();
                    xhr.open('PUT', uploadUrl);
                    xhr.setRequestHeader('Content-Type', pending.file.type);
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            const pct = Math.round((e.loaded / e.total) * 100);
                            setPendingFiles((prev) => prev.map((p, i) => i === idx ? { ...p, progress: pct } : p));
                        }
                    };
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            setPendingFiles((prev) => prev.map((p, i) => i === idx ? { ...p, status: 'done', key, name } : p));
                            resolve({ key, name: name ?? pending.file.name, mimeType: pending.file.type, size: pending.file.size });
                        }
                        else {
                            reject(new Error(`Upload failed: ${xhr.status}`));
                        }
                    };
                    xhr.onerror = () => reject(new Error('Network error'));
                    xhr.send(pending.file);
                }
                catch (err) {
                    setPendingFiles((prev) => prev.map((p, i) => i === idx ? { ...p, status: 'error' } : p));
                    reject(err);
                }
            });
        });
    };
    const send = async () => {
        if ((!text.trim() && !pendingFiles.length) || sending || !chat?.id)
            return;
        setSending(true);
        try {
            const uploadedFiles = pendingFiles.length
                ? await Promise.all(pendingFiles.map((p, i) => uploadFile(p, i)))
                : [];
            socketRef.current?.emit('support:message', {
                text: text.trim() || undefined,
                files: uploadedFiles.length ? uploadedFiles : undefined,
            }, (res) => {
                if (!res?.ok)
                    console.error('send failed', res);
            });
            setText('');
            setPendingFiles([]);
        }
        catch (err) {
            console.error('Send error:', err);
        }
        finally {
            setSending(false);
        }
    };
    if (isLoading)
        return _jsx(Layout, { children: _jsx(Spinner, {}) });
    return (_jsx(Layout, { children: _jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8 flex flex-col", style: { height: 'calc(100vh - 80px)' }, children: [_jsxs("div", { className: "bg-white rounded-t-3xl border border-slate-200 border-b-0 px-6 py-4 flex-shrink-0", children: [_jsx("h1", { className: "text-sm font-semibold text-slate-900", children: t('title') }), _jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: t('subtitle') })] }), _jsxs("div", { className: "flex-1 overflow-y-auto bg-slate-50 border-x border-slate-200 px-4 py-4 space-y-3", children: [hasMore && (_jsx("div", { className: "text-center", children: _jsx("button", { onClick: loadMore, disabled: loadingMore, className: "text-xs text-blue-600 hover:underline disabled:opacity-50 transition", children: loadingMore ? t('loading') : t('loadMore') }) })), messages.length === 0 && (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("p", { className: "text-sm text-slate-400 text-center py-8", children: t('emptyState') }) })), messages.map((msg) => {
                            const isOwn = msg.senderId === userId;
                            const isAdmin = msg.senderRole === 'admin';
                            return (_jsx("div", { className: `flex ${isOwn ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-[75%] px-4 py-2.5 text-sm space-y-1.5
                    ${isOwn
                                        ? 'bg-blue-600 text-white rounded-3xl rounded-br-sm'
                                        : isAdmin
                                            ? 'bg-white text-slate-900 border border-orange-200 rounded-3xl rounded-bl-sm'
                                            : 'bg-white text-slate-900 border border-slate-200 rounded-3xl rounded-bl-sm'}`, children: [!isOwn && (_jsx("p", { className: `text-xs font-semibold ${isAdmin ? 'text-orange-500' : 'text-slate-400'}`, children: isAdmin ? t('senderLabel.support') : msg.senderRole })), msg.text && (_jsx("p", { className: "whitespace-pre-wrap break-words leading-relaxed", children: msg.text })), msg.attachments?.length > 0 && (_jsx("div", { className: "space-y-1.5 mt-1", children: msg.attachments.map((a) => (_jsx(AttachmentView, { attachment: a, isOwn: isOwn }, a.id))) })), _jsx("p", { className: `text-xs text-right ${isOwn ? 'text-blue-200' : 'text-slate-300'}`, children: new Date(msg.createdAt).toLocaleTimeString('de-DE', {
                                                hour: '2-digit', minute: '2-digit',
                                            }) })] }) }, msg.id));
                        }), _jsx("div", { ref: bottomRef })] }), pendingFiles.length > 0 && (_jsx("div", { className: "bg-white border-x border-slate-200 px-4 py-2.5 flex flex-wrap gap-2", children: pendingFiles.map((pf, i) => (_jsxs("div", { className: "flex items-center gap-1.5 bg-slate-100 rounded-xl px-3 py-1.5 text-xs", children: [_jsx("span", { className: "truncate max-w-[120px] text-slate-700", children: pf.file.name }), pf.status === 'uploading' && (_jsxs("span", { className: "text-blue-600 font-medium", children: [pf.progress, "%"] })), pf.status === 'done' && (_jsx("span", { className: "text-green-600", children: "\u2713" })), pf.status === 'error' && (_jsx("span", { className: "text-red-500", children: t('file.error') })), pf.status === 'pending' && (_jsx("button", { onClick: () => removePending(i), className: "text-slate-400 hover:text-slate-600 ml-0.5 transition", "aria-label": "Datei entfernen", children: "\u2715" }))] }, i))) })), _jsxs("div", { className: "bg-white rounded-b-3xl border border-slate-200 border-t border-t-slate-200\r\n          px-4 py-3 flex items-end gap-2 flex-shrink-0", children: [_jsx("button", { onClick: () => fileInputRef.current?.click(), className: "p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100\r\n              transition flex-shrink-0", title: t('input.attachTitle'), "aria-label": t('input.attachTitle'), children: "\uD83D\uDCCE" }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, className: "hidden", onChange: onFileChange, accept: "image/*,.pdf,.doc,.docx,.txt" }), _jsx("textarea", { value: text, onChange: (e) => setText(e.target.value), onKeyDown: (e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    send();
                                }
                            }, placeholder: t('input.placeholder'), rows: 1, className: "flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm\r\n              focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none\r\n              max-h-32 overflow-y-auto text-slate-900 placeholder:text-slate-400", style: { minHeight: '42px' } }), _jsx("button", { onClick: send, disabled: (!text.trim() && !pendingFiles.length) || sending, className: "bg-blue-600 hover:bg-blue-700 disabled:opacity-40\r\n              text-white px-4 py-2.5 rounded-xl transition text-sm font-medium flex-shrink-0", children: sending ? t('input.sending') : t('input.send') })] })] }) }));
}
