import type { TokenPayload } from '../../infrastructure/service/tokenService'; // или откуда у тебя payload

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload; // ВАЖНО: не ClientAttributes|TutorAttributes, а то, что реально кладёшь в req.user
  }
}

export {};
