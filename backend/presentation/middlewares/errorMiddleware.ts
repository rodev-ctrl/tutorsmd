// presentation/middlewares/errorMiddleware.ts

import { NextFunction, Request, Response } from 'express';
import { DomainError } from '../../domain/errors/DomainError';
import { ValidationError } from '../../domain/errors/ValidationError';
import { NotFoundError } from '../../domain/errors/NotFoundError';
import { ConflictError } from '../../domain/errors/ConflictError';

const isProd = process.env.NODE_ENV === 'production';

export const errorMiddleware = (
  err: Error & { status?: number; statusCode?: number },
  req: Request,
  res: Response,
  next: NextFunction,
): void => {

  // Логируем все ошибки кроме клиентских (4xx)
  if (!isDomainError(err)) {
    console.error(err);
  }

  // ─── Domain errors → HTTP статусы ────────────────────────────

  if (err instanceof ValidationError) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ message: err.message });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({ message: err.message });
    return;
  }

  if (err instanceof DomainError) {
    // Базовый DomainError — 422 Unprocessable Entity
    res.status(422).json({ message: err.message });
    return;
  }

  // ─── Неизвестные ошибки → 500 ────────────────────────────────

  const status = err.status ?? err.statusCode ?? 500;

  res.status(status).json({
    message: isProd ? 'Internal server error' : err.message,
    stack: isProd ? undefined : err.stack,
  });
};

function isDomainError(err: Error): boolean {
  return err instanceof DomainError;
}