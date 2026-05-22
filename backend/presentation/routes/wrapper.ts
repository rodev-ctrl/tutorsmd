import { NextFunction, Request, Response, RequestHandler, Router } from 'express';

export const wrap = (
  fn: (req: Request, res: Response) => Promise<void>
): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };