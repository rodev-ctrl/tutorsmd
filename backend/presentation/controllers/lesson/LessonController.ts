import { Request, Response } from 'express';
import { ILessonController }                from './ILessonController';
import { CreateTrialLessonUseCase }         from '../../../application/usecases/lesson/trial/CreateTrialLessonUseCase';
import { GetUserLessonUseCase }             from '../../../application/usecases/lesson/GetUserLessonUseCase';
import { ConfirmLessonUseCase }             from '../../../application/usecases/lesson/ConfirmLessonUseCase';
import { RejectLessonUseCase }              from '../../../application/usecases/lesson/RejectLessonUseCase';
import { StartLessonUseCase }               from '../../../application/usecases/lesson/StartLessonUseCase';
import { CompleteLessonUseCase }            from '../../../application/usecases/lesson/CompleteLessonUseCase';
import { CancelLessonUseCase }              from '../../../application/usecases/lesson/CancelLessonUseCase';
import { ProposeLessonRescheduleUseCase }   from '../../../application/usecases/lesson/reschedule/ProposeLessonRescheduleUseCase';
import { AcceptRescheduleProposalUseCase }  from '../../../application/usecases/lesson/reschedule/AcceptRescheduleProposalUseCase';
import { DeclineRescheduleProposalUseCase } from '../../../application/usecases/lesson/reschedule/DeclineRescheduleProposalUseCase';
import { RescheduleLessonByClientUseCase }  from '../../../application/usecases/lesson/reschedule/RescheduleLessonByClientUseCase';
import { MarkNoShowClientUseCase }          from '../../../application/usecases/lesson/no-show/MarkNoShowClientUseCase';
import { MarkNoShowTutorUseCase }           from '../../../application/usecases/lesson/no-show/MarkNoShowTutorUseCase';
import { UploadLessonMaterialUseCase }      from '../../../application/usecases/lesson/material/UploadLessonMaterialUseCase';
import { GetLessonMaterialsUseCase }        from '../../../application/usecases/lesson/material/GetLessonMaterialUseCase';
import { DeleteLessonMaterialUseCase }      from '../../../application/usecases/lesson/material/DeleteLessonMaterialUseCase';
import { CreateRegularScheduleUseCase }     from '../../../application/usecases/lesson/regular/CreateRegularScheduleUseCase';
import { CancelRegularScheduleUseCase }     from '../../../application/usecases/lesson/regular/CancelRegularScheduleUseCase';
import { CancelSingleLessonUseCase }        from '../../../application/usecases/lesson/regular/CancelSingleLessonUseCase';
import {
  CreateTrialLessonBody,
  CreateRegularScheduleBody,
  CancelLessonBody,
  ProposeRescheduleBody,
  RescheduleByClientBody,
  StartLessonBody,
  UploadMaterialBody,
  LessonIdParams,
  ScheduleIdParams,
  MaterialIdParams,
} from './lesson.schema';

export class LessonController implements ILessonController {
  constructor(
    private readonly createTrialUseCase:           CreateTrialLessonUseCase,
    private readonly getLessonUseCase:             GetUserLessonUseCase,
    private readonly confirmUseCase:               ConfirmLessonUseCase,
    private readonly rejectUseCase:                RejectLessonUseCase,
    private readonly startUseCase:                 StartLessonUseCase,
    private readonly completeUseCase:              CompleteLessonUseCase,
    private readonly cancelUseCase:                CancelLessonUseCase,
    private readonly proposeRescheduleUseCase:     ProposeLessonRescheduleUseCase,
    private readonly acceptRescheduleUseCase:      AcceptRescheduleProposalUseCase,
    private readonly declineRescheduleUseCase:     DeclineRescheduleProposalUseCase,
    private readonly rescheduleLessonUseCase:      RescheduleLessonByClientUseCase,
    private readonly markNoShowClientUseCase:      MarkNoShowClientUseCase,
    private readonly markNoShowTutorUseCase:       MarkNoShowTutorUseCase,
    private readonly uploadMaterialUseCase:        UploadLessonMaterialUseCase,
    private readonly getMaterialUseCase:           GetLessonMaterialsUseCase,
    private readonly deleteMaterialUseCase:        DeleteLessonMaterialUseCase,
    private readonly createRegularScheduleUseCase: CreateRegularScheduleUseCase,
    private readonly cancelRegularScheduleUseCase: CancelRegularScheduleUseCase,
    private readonly cancelSingleLessonUseCase:    CancelSingleLessonUseCase,
  ) {}


  async createTrial(
    req: Request<{}, {}, CreateTrialLessonBody>,
    res: Response,
  ): Promise<void> {
    const clientId = req.user!.profileId; // client.id
    const { tutorId, subjectId, scheduledAt, durationMinutes } = req.body;

    const result = await this.createTrialUseCase.execute({
      clientId,
      tutorId,
      subjectId,
      scheduledAt:     new Date(scheduledAt),
      durationMinutes,
    });

    res.status(201).json(result);
  }


  async getLesson(
    req: Request<LessonIdParams>,
    res: Response,
  ): Promise<void> {
    const profileId = req.user!.profileId;
    const { lessonId } = req.params;

    const lesson = await this.getLessonUseCase.execute({ lessonId, profileId });
    res.status(200).json(lesson);
  }


  async confirm(
    req: Request<LessonIdParams>,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.profileId; // tutor.id
    const { lessonId } = req.params;

    await this.confirmUseCase.execute({ lessonId, tutorId });
    res.status(200).json({ message: 'Lesson confirmed.' });
  }

  async reject(
    req: Request<LessonIdParams>,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.profileId;
    const { lessonId } = req.params;

    await this.rejectUseCase.execute({ lessonId, tutorId });
    res.status(200).json({ message: 'Lesson rejected.' });
  }

  async start(
    req: Request<LessonIdParams, {}, StartLessonBody>,
    res: Response,
  ): Promise<void> {
    const startedById = req.user!.profileId;
    const role        = req.user!.activeRole as 'client' | 'tutor';
    const { lessonId } = req.params;
    const { roomId }   = req.body;

    const result = await this.startUseCase.execute({
      lessonId,
      startedById,
      role,
    });
    res.status(200).json({ message: 'Lesson started.', roomId: result.roomId });
  }

  async complete(
    req: Request<LessonIdParams>,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.profileId;
    const { lessonId } = req.params;

    await this.completeUseCase.execute({ lessonId, tutorId });
    res.status(200).json({ message: 'Lesson completed.' });
  }

 
  async cancelByClient(
    req: Request<LessonIdParams, {}, CancelLessonBody>,
    res: Response,
  ): Promise<void> {
    const clientId = req.user!.profileId;
    const { lessonId } = req.params;
    const { reason }   = req.body;

    await this.cancelUseCase.execute({
      lessonId,
      cancelledByUserId: clientId, 
      role: 'client',
      reason,
    });
    res.status(200).json({ message: 'Lesson cancelled.' });
  }

  async cancelByTutor(
    req: Request,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.profileId;
    const { lessonId } = req.params;
    const { reason }   = req.body;

    await this.cancelUseCase.execute({
      lessonId,
      cancelledByUserId: tutorId,
      role: 'tutor',
      reason,
    });
    res.status(200).json({ message: 'Lesson cancelled.' });
  }

  // ─── Reschedule ───────────────────────────────────────────────

  async proposeReschedule(
    req: Request,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.profileId;
    const { lessonId }     = req.params;
    const { newScheduledAt } = req.body;

    await this.proposeRescheduleUseCase.execute({
      lessonId,
      tutorId,
      proposedScheduledAt: new Date(newScheduledAt),
    });
    res.status(200).json({ message: 'Reschedule proposed.' });
  }

  async acceptReschedule(
    req: Request,
    res: Response,
  ): Promise<void> {
    const clientId = req.user!.profileId;
    const { lessonId } = req.params;

    const result = await this.acceptRescheduleUseCase.execute({ lessonId, clientId });
    res.status(200).json(result);
  }

  async declineReschedule(
    req: Request,
    res: Response,
  ): Promise<void> {
    const clientId = req.user!.profileId;
    const { lessonId } = req.params;

    await this.declineRescheduleUseCase.execute({ lessonId, clientId });
    res.status(200).json({ message: 'Reschedule declined.' });
  }

  async rescheduleByClient(
    req: Request,
    res: Response,
  ): Promise<void> {
    const clientId = req.user!.profileId;
    const { lessonId }      = req.params;
    const { newScheduledAt, durationMinutes } = req.body;

    const result = await this.rescheduleLessonUseCase.execute({
      lessonId,
      clientId,
      newScheduledAt:  new Date(newScheduledAt),
      durationMinutes,
    });
    res.status(200).json(result);
  }

  


  async markNoShowClient(
    req: Request,
    res: Response,
  ): Promise<void> {
    const tutorId = req.user!.profileId;
    const { lessonId } = req.params;

    // MarkNoShowClientUseCase принимает tutorId
    await this.markNoShowClientUseCase.execute({ lessonId, tutorId });
    res.status(200).json({ message: 'No-show marked for client.' });
  }

  async markNoShowTutor(
    req: Request,
    res: Response,
  ): Promise<void> {
    // MarkNoShowTutorUseCase принимает adminId — только admin может вызывать
    const adminId = req.user!.profileId;
    const { lessonId } = req.params;

    await this.markNoShowTutorUseCase.execute({ lessonId, adminId });
    res.status(200).json({ message: 'No-show marked for tutor.' });
  }

  // ─── Materials ────────────────────────────────────────────────

  async uploadMaterial(
    req: Request,
    res: Response,
  ): Promise<void> {
    const uploaderId   = req.user!.profileId;
    const uploaderRole = req.user!.activeRole as 'client' | 'tutor';
    const { lessonId } = req.params;
    const { materialType, fileName, mimeType, fileSize } = req.body;

    const result = await this.uploadMaterialUseCase.execute({
      lessonId,
      uploaderId,
      uploaderRole,
      materialType,
      fileName,
      mimeType,
      fileSize,
    });
    res.status(201).json(result);
  }

  async getMaterials(
    req: Request,
    res: Response,
  ): Promise<void> {
    const requesterId   = req.user!.profileId;
    const requesterRole = req.user!.activeRole as 'client' | 'tutor';
    const { lessonId }  = req.params;

    const materials = await this.getMaterialUseCase.execute({
      lessonId,
      requesterId,
      requesterRole,
    });
    res.status(200).json({ materials });
  }

  async deleteMaterial(
    req: Request<MaterialIdParams>,
    res: Response,
  ): Promise<void> {
    const deleterId   = req.user!.profileId;
    const deleterRole = req.user!.activeRole as 'client' | 'tutor';
    const { materialId } = req.params;

    await this.deleteMaterialUseCase.execute({
      materialId,
      deleterId,
      deleterRole,
    });
    res.status(200).json({ message: 'Material deleted.' });
  }

  // ─── Regular schedule ─────────────────────────────────────────

  async createRegularSchedule(
    req: Request<{}, {}, CreateRegularScheduleBody>,
    res: Response,
  ): Promise<void> {
    const clientId = req.user!.profileId;
    const { tutorId, subjectId, dayOfWeek, timeOfDay, firstLessonAt, durationMinutes } = req.body;

    const result = await this.createRegularScheduleUseCase.execute({
      clientId,
      tutorId,
      subjectId,
      dayOfWeek,
      timeOfDay:     new Date(timeOfDay),
      firstLessonAt: new Date(firstLessonAt),
      durationMinutes,
    });
    res.status(201).json(result);
  }

  async cancelRegularSchedule(
    req: Request<ScheduleIdParams>,
    res: Response,
  ): Promise<void> {
    const cancelledByUserId = req.user!.profileId;
    const role              = req.user!.activeRole as 'client' | 'tutor';
    const { scheduleId }    = req.params;

    await this.cancelRegularScheduleUseCase.execute({
      scheduleId,
      cancelledByUserId, // ← поле из use case
      role,
    });
    res.status(200).json({ message: 'Regular schedule cancelled.' });
  }

  async cancelSingleLesson(
    req: Request<LessonIdParams, {}, CancelLessonBody>,
    res: Response,
  ): Promise<void> {
    const cancelledById = req.user!.profileId;
    const role          = req.user!.activeRole as 'client' | 'tutor';
    const { lessonId }  = req.params;
    const { reason }    = req.body;

    await this.cancelSingleLessonUseCase.execute({
      lessonId,
      cancelledById, // ← поле из use case
      role,
      reason,
    });
    res.status(200).json({ message: 'Single lesson cancelled.' });
  }
}