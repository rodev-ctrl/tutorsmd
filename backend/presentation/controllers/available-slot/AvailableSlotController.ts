import { Request, Response } from 'express';
import { IAvailableSlotController } from './IAvailableSlotController';
import { CreateAvailableSlotUseCase }  from '../../../application/usecases/available-slot/CreateAvailableSlotUseCase';
import { DeleteAvailableSlotUseCase }  from '../../../application/usecases/available-slot/DeleteAvailableUseCase';
import { GetTutorOwnSlotsUseCase }     from '../../../application/usecases/available-slot/GetTutorOwnSlotsUseCase';
import { GetTutorPublicSlotsUseCase }  from '../../../application/usecases/available-slot/GetTutorPublicSlotsUseCase';
import {
  CreateAvailableSlotBody,
  DeleteAvailableSlotParams,
  TutorIdParams,
} from './available-slot.schema';

export class AvailableSlotController implements IAvailableSlotController {
  constructor(
    private readonly createSlotUseCase:     CreateAvailableSlotUseCase,
    private readonly deleteSlotUseCase:     DeleteAvailableSlotUseCase,
    private readonly getOwnSlotsUseCase:    GetTutorOwnSlotsUseCase,
    private readonly getPublicSlotsUseCase: GetTutorPublicSlotsUseCase,
  ) {}

  // POST /slots - тьютор создаёт слот
  async createSlot(
    req: Request<{}, {}, CreateAvailableSlotBody>,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.userId;
    const { dayOfWeek, startTime, endTime } = req.body;

    const result = await this.createSlotUseCase.execute({
      tutorId,
      dayOfWeek,
      startTime,
      endTime,
    });

    res.status(201).json({ slotId: result.slotId });
  }

  // DELETE /slots/:slotId - тьютор удаляет слот
  async deleteSlot(
    req: Request<DeleteAvailableSlotParams>,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.userId;
    const { slotId } = req.params;

    await this.deleteSlotUseCase.execute({ slotId, tutorId });

    res.status(200).json({ message: 'Slot deleted.' });
  }

  // GET /slots/me - тьютор видит свои слоты включая неактивные
  async getOwnSlots(req: Request, res: Response): Promise<void> {
    const tutorId = req.user!.userId;

    const slots = await this.getOwnSlotsUseCase.execute({
      tutorId,
      requestedByTutorId: tutorId,
    });

    res.status(200).json({ slots });
  }

  // GET /slots/tutor/:tutorId - публичные активные слоты тьютора
  async getPublicSlots(
    req: Request<TutorIdParams>,
    res: Response,
  ): Promise<void> {
    const { tutorId } = req.params;

    const slots = await this.getPublicSlotsUseCase.execute(tutorId);

    res.status(200).json({ slots });
  }
}