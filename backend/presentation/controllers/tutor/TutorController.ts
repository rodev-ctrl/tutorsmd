
import { Request, Response } from 'express';
import { ITutorController }          from './ITutorController';
import { GetTutorPublicProfileUseCase }    from '../../../application/usecases/tutor/public/GetTutorPublicProfileUseCase';
import { UpdateTutorProfileUseCase } from '../../../application/usecases/tutor/UpdateTutorProfileUseCase';
import { GetPendingTutorsUseCase }   from '../../../application/usecases/tutor/GetPendingTutorUseCase';
import { ApproveTutorUseCase }       from '../../../application/usecases/tutor/ApproveTutorUseCase';
import { RejectTutorUseCase }        from '../../../application/usecases/tutor/RejectTutorUseCase';
import { GetTutorByUserIdUseCase } from '../../../application/usecases/tutor/GetTutorByUserIdUseCase';
import { SubmitTutorApplicationUseCase } from '../../../application/usecases/tutor/SubmitTutorApplicationUseCase';
import { StartTutorReviewUseCase } from '../../../application/usecases/tutor/StartTutorReviewUseCase';



import {
  UpdateTutorProfileDto,
  RejectTutorDto,
  TutorIdParamsSchema,
} from './tutor.schema';

export class TutorController implements ITutorController {
  constructor(
    private readonly getTutorByUserIdUseCase: GetTutorByUserIdUseCase,
    private readonly getProfileUseCase: GetTutorPublicProfileUseCase,
    private readonly updateProfileUseCase: UpdateTutorProfileUseCase,
    private readonly getPendingTutorsUseCase: GetPendingTutorsUseCase,
    private readonly approveTutorUseCase: ApproveTutorUseCase,
    private readonly rejectTutorUseCase: RejectTutorUseCase,
    private readonly submitApplicationUseCase: SubmitTutorApplicationUseCase,
    private readonly startReviewUseCase: StartTutorReviewUseCase
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
    req: Request,
    res: Response,
  ): Promise<void> {
    
    // userId из JWT
    const userId = req.user!.userId;
    
    const tutorId = await this.getTutorByUserIdUseCase.execute(userId);
    if (!tutorId) {
      res.status(404).json({ message: 'Tutor profile not found' });
      return;
    }

     const body = req.body as UpdateTutorProfileDto;

    await this.updateProfileUseCase.execute({
      tutorId,
      ...body,
    });

    res.status(200).json({ message: 'Profile updated.' });
  }

  // GET /tutor/pending - только admin
  async getPendingTutors(req: Request, res: Response): Promise<void> {
    const tutors = await this.getPendingTutorsUseCase.execute();
    res.status(200).json({ tutors });
  }

  async submit(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  await this.submitApplicationUseCase.execute(userId);
  res.status(200).json({ message: 'Application submitted.' });
}

async startReview(req: Request, res: Response): Promise<void> {
  const { tutorId } = req.params as { tutorId: string };
  await this.startReviewUseCase.execute(tutorId);
  res.status(200).json({ message: 'Review started.' });
}

async getReviewProfile(req: Request, res: Response): Promise<void> {
  const { tutorId } = req.params as { tutorId: string };
  const profile = await this.getProfileUseCase.execute(tutorId);
  res.status(200).json({ profile });
}

  // POST /tutor/:tutorId/approve - только admin
  async approve(
    req: Request,
    res: Response,
  ): Promise<void> {
    const adminUserId = req.user!.userId;
    const { tutorId } = req.params as { tutorId: string };

    await this.approveTutorUseCase.execute({ tutorId, adminUserId });
    res.status(200).json({ message: 'Tutor approved.' });
  }

  // POST /tutor/:tutorId/reject - только admin
  async reject(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { tutorId } = req.params as { tutorId: string };;
    const { reason }  = req.body as RejectTutorDto;

    await this.rejectTutorUseCase.execute({ tutorId, reason });
    res.status(200).json({ message: 'Tutor rejected.' });
  }
}