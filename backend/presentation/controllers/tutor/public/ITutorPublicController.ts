import { Request, Response } from 'express';

export interface ITutorPublicController {
  getPublicList(req: Request, res: Response):    Promise<void>;
  getPublicProfile(req: Request, res: Response): Promise<void>;
}