import { Request, Response } from 'express';

export interface IAvailableSlotController {
  createSlot(req: Request, res: Response): Promise<void>;
  deleteSlot(req: Request, res: Response): Promise<void>;
  getOwnSlots(req: Request, res: Response): Promise<void>;
  getPublicSlots(req: Request, res: Response): Promise<void>;
}