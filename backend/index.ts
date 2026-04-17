import 'dotenv/config';
import 'express-async-errors';


import express from 'express';
import type { Request } from 'express';
import type { IncomingMessage, ServerResponse } from "http";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import sanitize from 'sanitize-filename';
import cron from 'node-cron';
import { Server as SocketIOServer, Socket } from 'socket.io';


import { GastController } from './presentation/controllers/gastController';
import { socketAuthMiddleware } from './presentation/websocket/index';

// Routes
import ClientRouter from './presentation/routes/ClientRoutes';
import TutorRouter from './routes/TutorRoutes';
import GastRouter from './routes/GastRoutes';
import AdminRouter from './routes/AdminRoutes';
import UserRouter from './routes/UserRoutes';
import UsersChatRouter from './routes/UsersChatRoutes';
import FileRouter from './routes/FileRoutes';

// Models
import Gast from './models/gastModel';
import Client from './models/clientModel';
import Tutor from './models/tutorModel';
import Booking from './models/bookingModel';

import Lesson from './models/lessonModel';
import LessonMessage from './models/lessonMessagesModel';

import { encrypt } from './infrastructure/encryption/encryption';

import errorMiddleware from './middlewares/errorMiddleware';

import { createClient } from 'redis';
import TokenService from './infrastructure/service/tokenService';
import ReviewRoutes from './routes/ReviewRoutes';




// ============================
//   REDIS ИНИЦИАЛИЗАЦИЯ
// ============================
const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (err: Error) => console.error("Redis error:", err));

redis.connect();

// ============ REDIS HELPERS ============
type DeskAction = {
  lessonId: string;
  pageIndex: number;
  email: string;
  type: "brush" | "line" | "rect" | "circle" | "text" | "erase";
  data: any;
  timestamp: number;
};

async function saveStrokeRedis(lessonId:string, pageIndex:number, action: DeskAction) {
  
  await redis.rPush(`board:${lessonId}:${pageIndex}`, JSON.stringify(action));

  // TTL - время хранения данных (действия доски) в Redis
  await redis.expire(`board:${lessonId}:${pageIndex}`, 60 * 60 * 3);    
  
}

async function getPageHistory(lessonId:string, pageIndex:number) {
  const key = `board:${lessonId}:${pageIndex}`;
  const arr = await redis.lRange(key, 0, -1);
  return arr.map((x) => JSON.parse(x));
}


const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL,  // Frontend domain
  credentials: true,               // Allow sending cookies
}));
app.use(cookieParser());

declare module 'express-serve-static-core' {
  interface Request {
    rawBody?: Buffer;
  }
}

app.use(express.json({
  limit: "10mb",
  verify: (
    req: IncomingMessage & { rawBody?: Buffer },
    _res: ServerResponse,
    buf: Buffer,
    _encoding: string
  ) => {
    (req as Request).rawBody = buf;
  }
}));


app.use(express.urlencoded({ extended: true, limit: "10mb" })); // For parsing URL-encoded requests

///////////// CRUD ////////////////
app.use('/api', ClientRouter, TutorRouter, GastRouter, AdminRouter, UserRouter, FileRouter, UsersChatRouter, ReviewRoutes);
///////////////////////////////////

// Статика
app.use(express.static(path.join(__dirname, 'public')));
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "questionFiles");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });  
app.use("/api/qf", express.static(UPLOAD_DIR));

// Подключение обработчика ошибок
app.use(errorMiddleware);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  path: "/socket.io",
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
  pingTimeout: 30000,
  allowUpgrades: true,
  maxHttpBufferSize: 1e7, // 10 MB
});


io.use(socketAuthMiddleware(new TokenService())); // ← ВАЖНО: передача сервиса через DI



// ===== In-memory presence (для уроков) =====
const presenceRooms: Map<string, Set<string>> = new Map(); // lessonId -> Set(socketid)

const addParticipant = (room: string, socketId: string) => {
  const set = presenceRooms.get(room) ?? new Set<string>();
  set.add(socketId);
  presenceRooms.set(room, set);
  return [...set];
};


function removeParticipant(room: string, socketId: string): string[] {
  const set = presenceRooms.get(room);
  if (!set) return [];
  set.delete(socketId);
  if (set.size === 0) presenceRooms.delete(room);
  return [...set];
}

function listParticipants(roomId: string): string[] {
  return Array.from(presenceRooms.get(roomId) ?? []);
}

type LessonType = "trial" | "regular";

type LessonContext = {
  lessonid: string;
  client_email: string;
  tutor_email: string;
  start_at: Date;
  status: string;
  // type: LessonType;
  source: "lesson" | "booking";
};

const fsSafeFolder = (s: string) =>
  crypto.createHash("sha256").update(s).digest("hex");



  interface WireFileIn {
    name: string;
    type: string;
    data: number[]; // байты
  }
  
  interface WireMessageOut {
    id: string;
    ts: number;
    question?: string;
    answer?: string;
    language?: string;
    files?: Array<{ name: string; url: string; type?: string; size?: number }>;
  }

  // Сохранить файлы и вернуть метаданные (URLы для фронта)
  const saveFiles = (chatKey: string, files?: WireFileIn[]) => {
    if (!files?.length) return [];
  
    const enc = encrypt(chatKey);               // строка вида "<ivHex>:<cipherHex>"
    const folder = fsSafeFolder(enc);           // ← СТРОКА (hex), безопасная для путей
    const userDir = path.join(UPLOAD_DIR, folder);
    fs.mkdirSync(userDir, { recursive: true });
  
    return files.map((f, idx) => {
      const clean = sanitize(f.name || `file_${idx}`);
      const fileName = `${Date.now()}_${idx}_${clean}`;
      const filePath = path.join(userDir, fileName);
  
      // f.data у вас number[] (байты) — это корректно:
      const buf = Array.isArray(f.data) ? Buffer.from(f.data) : Buffer.from([]);
      fs.writeFileSync(filePath, buf);
  
      return {
        name: clean,
        url: `/qf/${folder}/${fileName}`,
        size: buf.length,
        type: f.type,
      };
    });
  };

// Запуск очистки каждое воскресенье в полночь
cron.schedule('0 0 * * 0', () => {
  GastController.cleanOldGuestData();
});

async function resolveLessonContext(lessonid: string): Promise<LessonContext | null> {
  const lesson = await Lesson.findOne({ where: { lessonid } });

  if (lesson) {
    return {
      lessonid: lesson.lessonid,
      client_email: lesson.client_email,
      tutor_email: lesson.tutor_email,
      start_at: lesson.start_at,
      status: lesson.status,
      //type: (lesson.type as LessonType) || "regular",
      source: "lesson",
    };
  }

  const booking = await Booking.findOne({ where: { lessonid } });
  if (!booking || !booking.clientid) return null;

  const client = await Client.findOne({ where: { id: booking.clientid } });
  if (!client?.email) return null;

  const startAt = new Date(booking.datetime);
  if (Number.isNaN(startAt.getTime())) return null;

  return {
    lessonid: booking.lessonid,
    client_email: client.email,
    tutor_email: booking.tutoremail,
    start_at: startAt,
    status: booking.status,
    // type: "trial",
    source: "booking",
  };
}

  

io.on("connection", (socket: Socket) => {
  socket.on("join", async () => {

    const user = socket.data.user; 
    if (!user) return socket.disconnect(); 

    const { id, email, role } = user;
/*
    let tokenModel = null as any;

    switch (role) {
      case "client":
        tokenModel = ClientToken;
        break;
      case "tutor":
        tokenModel = TutorToken;
        break;
      case "gast":
        break;
      case "admin":
        break;
      default:
        return;
    }
        */

    try {
      /*
        if (role === "client") {
          const foundToken = await tokenModel.findOne({ where: { clientid: user.id } });
          if (!foundToken) return;
        } else if (role === "tutor") {
          const foundToken = await tokenModel.findOne({ where: { tutorid: user.id } });
          if (!foundToken) return;
        }
      */
      

      const chatid = encrypt(email);
      socket.data.chatId = chatid;
      await socket.join(chatid);
      io.to(chatid).emit("joined", { email, role });
    } catch (err) {
      console.error("Ошибка при обработке join:", err);
    }
  });




const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

// внутри io.on("connection", (socket) => { ... })
socket.on("joinLesson", async (data: { lessonid: string }) => {
  try {
  
    const user = socket.data.user as { email: string; role: string } | undefined;
    if (!user) {
      socket.emit("joinLessonError", { code: "UNAUTHORIZED", message: "Unauthorized" });
      return socket.disconnect();
    }

    // 1) idempotency: если уже присоединились — просто подтверждаем
    if (socket.data.lessonCtx?.lessonid) {
      socket.emit("joinedLesson", {
        startAt: socket.data.lessonCtx.start_at,
        status: socket.data.lessonCtx.status,
        source: socket.data.lessonCtx.source,
      });
      return;
    }

    // 2) basic input validation
    const lessonid = String(data?.lessonid || "").trim();
    if (!lessonid) {
      socket.emit("joinLessonError", { code: "BAD_REQUEST", message: "lessonid is required" });
      return;
    }

    const ctx = await resolveLessonContext(lessonid);
    if (!ctx) {
      socket.emit("joinLessonError", "Lesson not found");
      return;
    }

    const { email, role } = user;

    const isAllowed =
      role === "admin" ||
      email === ctx.client_email ||
      email === ctx.tutor_email;

    if (!isAllowed) {
      socket.emit("joinLessonError", { code: "FORBIDDEN", message: "Access denied" });
      return;
    }

   
    socket.data.lessonCtx = ctx;     // единый контекст
    socket.data.lessonid = ctx.lessonid; // для совместимости с твоим кодом (но дальше лучше везде lessonCtx)


    await socket.join(ctx.lessonid);

    // presence
    const list = addParticipant(ctx.lessonid, socket.id);
    io.to(ctx.lessonid).emit("updateParticipants", list);

    // tutor signal (как у тебя было)
    if (role === "tutor") {
      io.to(ctx.lessonid).emit("tutorJoined", true);
    }

    // acknowledge to THIS socket (лучше всегда, не только tutor)
    socket.emit("joinedLesson", {
      startAt: ctx.start_at,
      status: ctx.status,
      //type: ctx.type,
      source: ctx.source,
    });
  } catch (err) {
    console.error("[joinLesson] error:", err);
    socket.emit("joinLessonError", { code: "SERVER_ERROR", message: "Internal error" });
  }
});




socket.on("joinLessonChat", async (data: { lessonid: string }) => {
  try {
    const ctx: LessonContext | undefined = socket.data.lessonCtx;
    const user = socket.data.user as { email: string; role: string } | undefined;
    const { lessonid } = data;

    if (!lessonid || !ctx || !user) return;
    if (ctx.lessonid !== lessonid) return;

    const room = `lesson:${lessonid}`;

    // 🔒 ГЛАВНЫЙ ФИКС
    if (socket.rooms.has(room)) return;

    socket.data.lessonChatJoined = true;

    await socket.join(room);

    const history = await LessonMessage.findAll({
      where: { lessonid },
      order: [["created_at", "ASC"]],
      limit: 50,
    });

    socket.emit("lessonChatHistory", history);
    socket.emit("joinedLessonChat", { success: true });

    io.to(room).emit("userJoinedLessonChat", {
      email: user.email,
      role: user.role,
    });

  } catch (error) {
    console.error("Ошибка при подключении пользователя:", error);
  }
});


  socket.on("lessonMessage", async (data: { msg: any; lessonid: string }) => {
    
    const ctx: LessonContext | undefined = socket.data.lessonCtx;
    const user = socket.data.user;
    if (!ctx || !user) return;

    const { msg, lessonid } = data;
    console.log(msg);
    console.log(lessonid);
    console.log(ctx.lessonid !== lessonid);
    console.log(ctx.lessonid);
    console.log(msg.trim());
    if (!lessonid || ctx.lessonid !== lessonid || !msg.trim()) return;

    console.log("creation");
    const newMessage = await LessonMessage.create({
      lessonid: lessonid,
      sender_email: user.email,
      text: msg.trim(),
      type: "text"
    });

    const payload = {
      id: newMessage.id,
      lessonid: newMessage.lessonid,
      sender_email: newMessage.sender_email,
      sender_role: user.role,
      text: newMessage.text,
      created_at: newMessage.created_at,
      type: newMessage.type,
    };

    io.to(`lesson:${lessonid}`).emit("newLessonMessage", payload);  
  });

  /*
  socket.on("messageLessonChat", async (...args: any[]) => {
    try {
      let randomLessonId: string, email: string, role: string, message: string;

      if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
        ({ randomLessonId, email, role, message } = args[0]);
      } else {
        [randomLessonId, email, role, message] = args as [string, string, string, string];
      }

      if (!randomLessonId) throw new Error("lessonID is required");
      if (!email) throw new Error("Email is required");
      if (!role) throw new Error("Role is required");
      if (!message) throw new Error("Message is required");

      // const lesson = await Lesson.findOne({ where: {lessonid: randomLessonId}});
       // нужно добавить в БД "lessons" сообщения "mesages", как в clients и tutors
        
       
        const user = await Lesson.findOne({ where: {randomLessonId}});

      // ===== сохраняем файлы на диск и формируем мета =====
      const filesMeta = saveFiles(chatKey, (msg.files || []) as WireFileIn[]);

      // ===== собираем легковесный payload для фронта =====
      const out: WireMessageOut = {
        id: crypto.randomUUID(),
        ts: Date.now(),
        question: msg.question,
        answer: msg.answer,
        language: msg.language,
        files: filesMeta.length ? filesMeta : undefined,
      };

      // ===== обновляем БД =====
      if (user || role === "admin") {
        // единый формат хранения: объект с optional ключами
        const stored = user ? user.messages || [] : [];
        const entry: any = {
          ...(msg.question ? { question: msg.question } : {}),
          ...(msg.answer ? { answer: msg.answer } : {}),
          ...(filesMeta.length ? { files: filesMeta } : {}),
          ...(msg.language ? { language: msg.language } : {}),
        };

        if (role === "client" && user) {
          await Client.update({ messages: [...stored, entry] }, { where: { id: user.id } });
        } else if (role === "tutor" && user) {
          await Tutor.update({ messages: [...stored, entry] }, { where: { id: user.id } });
        } else if (role === "admin") {
          // админ пишет кому-то: ищем адресата (клиент/тютор/гость)
          const tu = await Tutor.findOne({ where: { email: chatKey } });
          const cl = !tu && (await Client.findOne({ where: { email: chatKey } }));
          const ga = !tu && !cl && (await Gast.findOne({ where: { chatid: chatKey } }));
          if (tu) await Tutor.update({ messages: [...(tu.messages || []), entry] }, { where: { id: tu.id } });
          else if (cl) await Client.update({ messages: [...(cl.messages || []), entry] }, { where: { id: cl.id } });
          else if (ga) await Gast.update({ messages: [...(ga.messages || []), entry] }, { where: { chatid: chatKey } });
        }
      }

      // ===== рассылаем в комнату =====
      io.to(room).emit("message", out);
       
      

    } catch (error) {
      console.error("Ошибка при подключении пользователя:", error);
    }
  });
  */


  interface CustomFile {
    name: string;
    type: string;
    data: number[]; // байты
  }


  // Хэш для имени папки (безопасно для ФС)
  const hashChatId = (key: string) =>
    crypto.createHash("sha256").update(key).digest("hex");

  socket.on("message", async (data: { msg: any }) => {
    try {
      const { msg } = data || {};
      if (!msg) return;

      const role = socket.data.user.role;
      const email = socket.data.user.email;
/*
      // ===== валидация «отправителя» (упрощённо, как у тебя) =====
      let tokenModel: any = null;
      let userModel: any = null;

      switch (role) {
        case "client":
          tokenModel = ClientToken;
          userModel = Client;
          break;
        case "tutor":
          tokenModel = TutorToken;
          userModel = Tutor;
          break;
        case "gast":
          userModel = Gast;
          break;
        case "admin":
          // админ — отдельная ветка
          break;
        default:
          return;
      }
          */

      /*
       if (role === "client" || role === "tutor") {
        if (!userModel) return;
        // упрощённая проверка токенов
        if (tokenModel) {
          const tokens = await tokenModel.findAll({ where: { deviceid } });
          if (!tokens?.length) {
            console.warn("[message] no tokens for device");
            return;
          }
        }
        if(lessonid.length == 0) {
          user = await userModel.findOne({ where: { email } })
        } else {
          user = await Lesson.findOne({ where: {lessonid}});
        }

      } else if (role === "admin") {
        // ок
      }
      */

      // ===== что такое chatKey для комнаты =====
      // в UI мы используем комнаты на основе e-mail получателя.
      const chatKey = String(email); // здесь email — адресат/владелец диалога
      const room = encrypt(chatKey);

      // ===== сохраняем файлы на диск и формируем мета =====
      const filesMeta = saveFiles(chatKey, (msg.files || []) as WireFileIn[]);

      const out: WireMessageOut = {
        id: crypto.randomUUID(),
        ts: Date.now(),
        question: msg.question,
        answer: msg.answer,
        language: msg.language,
        files: filesMeta.length ? filesMeta : undefined,
      };

      // ===== обновляем БД =====
      if (socket.data.user || role === "admin") {
        // единый формат хранения: объект с optional ключами
        const stored = socket.data.user ? socket.data.user.messages || [] : [];
        const entry: any = {
          ...(msg.question ? { question: msg.question } : {}),
          ...(msg.answer ? { answer: msg.answer } : {}),
          ...(filesMeta.length ? { files: filesMeta } : {}),
        };

        if (role === "client" && socket.data.user) {
          await Client.update({ messages: [...stored, entry] }, { where: { id: socket.data.user.id } });
        } else if (role === "tutor" && socket.data.user) {
          await Tutor.update({ messages: [...stored, entry] }, { where: { id: socket.data.user.id } });
        } else if (role === "admin") {
          // админ пишет кому-то: ищем адресата (клиент/тютор/гость)
          const tu = await Tutor.findOne({ where: { email: chatKey } });
          const cl = !tu && (await Client.findOne({ where: { email: chatKey } }));
          const ga = !tu && !cl && (await Gast.findOne({ where: { chatid: chatKey } }));
          if (tu) await Tutor.update({ messages: [...(tu.messages || []), entry] }, { where: { id: tu.id } });
          else if (cl) await Client.update({ messages: [...(cl.messages || []), entry] }, { where: { id: cl.id } });
          else if (ga) await Gast.update({ messages: [...(ga.messages || []), entry] }, { where: { chatid: chatKey } });
        }
      }

      // ===== рассылаем в комнату =====
      io.to(room).emit("message", out);
    } catch (e) {
      console.error("[message] error:", e);
    }
  });

  socket.on("shareScreen", (randomLessonId: string, streamId: string) => {
    io.to(randomLessonId).emit("shareScreen", socket.id, streamId);
  });

  socket.on("sendStream", (randomLessonId: string, streamId: string) => {
    io.to(randomLessonId).emit("receiveStream", socket.id, streamId);
  });

  socket.on("updateStream", (randomLessonId: string, streamId: string) => {
    io.to(randomLessonId).emit("receiveStream", socket.id, streamId);
  });

  socket.on("leaveLesson", (randomLessonId: string) => {
    const list = removeParticipant(randomLessonId, socket.id);
    io.to(randomLessonId).emit("updateParticipants", list || []);
  });

  socket.on("endLesson", async (randomLessonId: string) => {
    
    // удаление пользователей из урока
    for (const token of listParticipants(randomLessonId)) {
      removeParticipant(randomLessonId, token);
    }
   
    // удаление временного созранения доски в Redis (все сохранится в Postgres -> backend -> папка) в конце урока
      const keys = await redis.keys(`board:${randomLessonId}:*`);
      if (keys.length) await redis.del(keys);
   
    
    io.to(randomLessonId).emit("meetingEnded");
  });

  // ======================================================
// =============== WHITEBOARD REAL-TIME =================
// ======================================================

// Клиент подключается к доске
socket.on("joinBoard", async (data: { lessonId: string }) => {

  const { lessonId } = data;
  socket.join(`board:${lessonId}`);

  const pattern = `board:${lessonId}:*`;
  const keys = await redis.keys(pattern);

  // Ключ → номер страницы → массив действий
const result: Record<number, any[]> = {};

for (const key of keys) {
  const parts = key.split(":");
  const page = parts[2];

  if (page === "dirty") continue;

  const pageIndex = Number(page);
  if (Number.isNaN(pageIndex)) continue;

  const history = await redis.lRange(key, 0, -1);

  result[pageIndex] = history.map((x) => JSON.parse(x));
}


  // Кидаем клиенту ВСЮ историю
  socket.emit("board:fullState", result);
});


// Клиент отправил новое действие (stroke, erase, rect…)
socket.on("board:action", async (action: DeskAction) => {
  const { lessonId, pageIndex } = action;

  // 1) пишем в Redis
  await saveStrokeRedis(lessonId, pageIndex, action);

  // 2) транслируем всем участникам доски
  io.to(`board:${lessonId}`).emit("board:action", action);
});


  socket.on("disconnect", () => {
    const roomId = socket.data?.lessonid as string | undefined;
    if (roomId) {
      const list = removeParticipant(roomId, socket.id);
      io.to(roomId).emit("updateParticipants", list);
    }
  });
});


/*
// Сохранение доски в Postgres каждые 5 секунд
setInterval(async () => {
  const keys = await redis.keys("board:*:*");

  for (const key of keys) {
    const parts = key.split(":"); 
    const lessonId = parts[1];
    const pageIndex = Number(parts[2]);

    const history = await redis.lRange(key, 0, -1);

    await sequelize.query(
      `INSERT INTO desks
       (lessonId, page_index, image_path, updated_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (lessonId,page_index)
       DO UPDATE SET image_path=$3, updated_at=NOW()`,
      [lessonId, pageIndex, JSON.stringify(history), `/desks/${lessonId}/${pageIndex}.png`]   // history — это массив строк (каждая строка — JSON action из Redis)
    );
  }

}, 10000); // каждые 10 секунд
*/

process.on("SIGTERM", () => redis.quit());
process.on("SIGINT", () => redis.quit());



try {
  
  server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  }).on('error', (err: { message: any; }) => {
    console.error('Error occurred:', err.message);
  });
} catch (e) {
  console.log(e);
}
