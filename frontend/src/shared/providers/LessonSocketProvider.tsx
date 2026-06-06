import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { io, Socket } from 'socket.io-client';

import { tokenManager } from '@shared/lib/TokenManager';

interface Props {
  lessonId: string;
  children: React.ReactNode;
}

interface ContextValue {
  socket: Socket;
  joined: boolean;
}

const LessonSocketContext =
  createContext<ContextValue | null>(null);

export const LessonSocketProvider = ({
  lessonId,
  children,
}: Props) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError]   = useState<string | null>(null);
 

  useEffect(() => {
  const s = io(import.meta.env.VITE_SOCKET_URL as string, {
    withCredentials: true,
    auth: { token: tokenManager.get() },
  });

  s.on('connect', () => {
    console.log('[Socket] Connected, emitting joinLesson for', lessonId);
    s.emit('lesson:join', { lessonId }, (response: { ok: boolean; error?: string }) => {
        console.log('[Socket] joinLesson response:', response);
      if (!response.ok) {
        setError(response.error ?? 'Failed to join lesson');
        console.log(response.error);
        console.log(error);
      } else {
        setJoined(true);
      }
    });
  });

   // При реконнекте повторно join
    s.on('reconnect', () => {
      setJoined(false);
      s.emit('lesson:join', { lessonId }, (response: { ok: boolean; error?: string }) => {
        if (response?.ok) setJoined(true);
      });
    });

  setSocket(s);

  return () => {
    s.emit('lesson:leave', { lessonId });
    s.disconnect();
    setJoined(false);
  };
}, [lessonId]);

  if (!socket) return null;

  return (
    <LessonSocketContext.Provider value={{socket, joined}}>
      {children}
    </LessonSocketContext.Provider>
  );
};

export const useLessonSocket = () => {
  const socket = useContext(LessonSocketContext);

  if (!socket) {
    throw new Error('LessonSocketProvider missing');
  }

  return socket;
};