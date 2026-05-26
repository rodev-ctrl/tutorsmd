
import { Request, Response } from 'express';
import { ITutorController }          from './ITutorController';
import { GetTutorPublicProfileUseCase }    from '../../../application/usecases/tutor/public/GetTutorPublicProfileUseCase';
import { UpdateTutorProfileUseCase } from '../../../application/usecases/tutor/UpdateTutorProfileUseCase';
import { GetPendingTutorsUseCase }   from '../../../application/usecases/tutor/GetPendingTutorUseCase';
import { ApproveTutorUseCase }       from '../../../application/usecases/tutor/ApproveTutorUseCase';
import { RejectTutorUseCase }        from '../../../application/usecases/tutor/RejectTutorUseCase';
import { GetTutorByUserIdUseCase } from '../../../application/usecases/tutor/GetTutorByUserIdUseCase';


import {
  UpdateTutorProfileDto,
  RejectTutorDto,
  TutorIdParams,
} from './tutor.schema';

export class TutorController implements ITutorController {
  constructor(
    private readonly getTutorByUserIdUseCase: GetTutorByUserIdUseCase,
    private readonly getProfileUseCase: GetTutorPublicProfileUseCase,
    private readonly updateProfileUseCase: UpdateTutorProfileUseCase,
    private readonly getPendingTutorsUseCase: GetPendingTutorsUseCase,
    private readonly approveTutorUseCase: ApproveTutorUseCase,
    private readonly rejectTutorUseCase: RejectTutorUseCase,
  ) {}

  // GET /tutor/profile - тьютор смотрит СВОЙ профиль
  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const tutorId = await this.getTutorByUserIdUseCase.execute(userId);
    if (!tutorId) {
      res.status(404).json({ message: 'Tutor profile not found' });
      return;
    }

    const profile = await this.getProfileUseCase.execute(tutorId);
    res.status(200).json({ profile });
  }

  // PUT /tutor/profile - тьютор обновляет СВОЙ профиль
  async updateProfile(
    req: Request<{}, {}, UpdateTutorProfileDto>,
    res: Response,
  ): Promise<void> {
    
    // userId из JWT
    const userId = req.user!.userId;
    
    const tutorId = await this.getTutorByUserIdUseCase.execute(userId);
    if (!tutorId) {
      res.status(404).json({ message: 'Tutor profile not found' });
      return;
    }

    const {
      nameDe, nameRu, surnameDe, surnameRu,
      highlightDe, highlightRu,
      fulldescribeDe, fulldescribeRu,
      hourlyRate,
    } = req.body;

    await this.updateProfileUseCase.execute({
      tutorId,
      nameDe, nameRu, surnameDe, surnameRu,
      highlightDe, highlightRu,
      fulldescribeDe, fulldescribeRu,
      hourlyRate,
    });

    res.status(200).json({ message: 'Profile updated.' });
  }

  // GET /tutor/pending - только admin
  async getPendingTutors(req: Request, res: Response): Promise<void> {
    const tutors = await this.getPendingTutorsUseCase.execute();
    res.status(200).json({ tutors });
  }

  // POST /tutor/:tutorId/approve - только admin
  async approve(
    req: Request<TutorIdParams>,
    res: Response,
  ): Promise<void> {
    const adminUserId = req.user!.userId;
    const { tutorId } = req.params;

    await this.approveTutorUseCase.execute({ tutorId, adminUserId });
    res.status(200).json({ message: 'Tutor approved.' });
  }

  // POST /tutor/:tutorId/reject - только admin
  async reject(
    req: Request<TutorIdParams, {}, RejectTutorDto>,
    res: Response,
  ): Promise<void> {
    const { tutorId } = req.params;
    const { reason }  = req.body;

    await this.rejectTutorUseCase.execute({ tutorId, reason });
    res.status(200).json({ message: 'Tutor rejected.' });
  }
}