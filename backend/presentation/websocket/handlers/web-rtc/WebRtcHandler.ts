
// Чистый сигнальный relay для WebRTC.
// Сервер не интерпретирует payload — только пересылает в комнату урока.
//
// События:
//   shareScreen  — трансляция экрана (начало)
//   sendStream   — отправка видео/аудио потока
//   updateStream — замена трека (напр. переключение камеры)
//   stopScreen   — остановка демонстрации экрана
//
// Все события привязаны к lessonId из socket.data.lessonCtx,
// чтобы клиент не мог вещать в чужую комнату.

import type { Server, Socket } from "socket.io";

export const createWebRtcHandler = (io: Server, socket: Socket): void => {
  const user = socket.data.user as { id: string } | undefined;
  if (!user) return;

  // Хелпер: проверяем, что lessonId соответствует текущему контексту сокета
  const isInLesson = (lessonId: string): boolean => {
    const ctx = socket.data.lessonCtx as { lessonId: string } | undefined;
    return !!ctx && ctx.lessonId === lessonId;
  };

  socket.on("shareScreen", (lessonId: string, streamId: string) => {
    if (!isInLesson(lessonId)) return;
    io.to(lessonId).emit("shareScreen", socket.id, streamId);
  });

  socket.on("stopScreen", (lessonId: string) => {
    if (!isInLesson(lessonId)) return;
    io.to(lessonId).emit("stopScreen", socket.id);
  });

  socket.on("sendStream", (lessonId: string, streamId: string) => {
    if (!isInLesson(lessonId)) return;
    io.to(lessonId).emit("receiveStream", socket.id, streamId);
  });

  socket.on("updateStream", (lessonId: string, streamId: string) => {
    if (!isInLesson(lessonId)) return;
    io.to(lessonId).emit("receiveStream", socket.id, streamId);
  });
};