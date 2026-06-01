import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectUserId } from '@entities/user/model/selectors';
import { tokenManager } from '@shared/lib/TokenManager';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
export const LessonChat = ({ lessonId }) => {
    const { t } = useTranslation('lesson');
    const userId = useSelector(selectUserId);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    useEffect(() => {
        const socket = io(import.meta.env.VITE_SOCKET_URL, {
            withCredentials: true,
            auth: { token: tokenManager.get() },
        });
        socketRef.current = socket;
        socket.emit('joinLessonChat', { lessonId });
        socket.on('lessonChatHistory', (history) => {
            setMessages(history);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        });
        socket.on('newLessonMessage', (msg) => {
            setMessages(prev => [...prev, msg]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        });
        return () => { socket.disconnect(); };
    }, [lessonId]);
    const send = () => {
        if (!text.trim())
            return;
        socketRef.current?.emit('lessonMessage', { lessonId, text: text.trim() });
        setText('');
    };
    return (_jsxs("div", { className: "flex flex-col h-full bg-slate-900", children: [_jsxs("div", { className: "flex-1 overflow-y-auto px-3 py-3 space-y-2", children: [messages.map((msg) => {
                        const isOwn = msg.senderId === userId;
                        return (_jsx("div", { className: `flex ${isOwn ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-[80%] px-3 py-2 text-sm rounded-2xl
                  ${isOwn
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-slate-700 text-slate-100 rounded-bl-sm'}`, children: [msg.text && (_jsx("p", { className: "whitespace-pre-wrap break-words leading-relaxed", children: msg.text })), msg.fileKey && (_jsxs("a", { href: msg.fileKey, target: "_blank", rel: "noreferrer", className: `text-xs underline underline-offset-2 block mt-1
                      ${isOwn ? 'text-blue-200' : 'text-slate-400'}`, children: ["\uD83D\uDCCE ", t('chat.file')] })), _jsx("p", { className: `text-xs mt-1 text-right
                  ${isOwn ? 'text-blue-200' : 'text-slate-500'}`, children: new Date(msg.createdAt).toLocaleTimeString('de-DE', {
                                            hour: '2-digit', minute: '2-digit',
                                        }) })] }) }, msg.id));
                    }), _jsx("div", { ref: bottomRef })] }), _jsxs("div", { className: "px-3 py-3 border-t border-slate-800 flex gap-2", children: [_jsx("input", { value: text, onChange: e => setText(e.target.value), onKeyDown: e => e.key === 'Enter' && !e.shiftKey && send(), placeholder: t('chat.placeholder'), className: "flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5\r\n            text-sm text-white placeholder:text-slate-500\r\n            focus:outline-none focus:ring-2 focus:ring-blue-600" }), _jsx("button", { onClick: send, disabled: !text.trim(), "aria-label": "Send", className: "bg-blue-600 hover:bg-blue-700 disabled:opacity-40\r\n            text-white px-3 py-2.5 rounded-xl transition text-sm font-medium", children: "\u2191" })] })] }));
};
