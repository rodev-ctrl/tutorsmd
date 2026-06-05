// presentation/controllers/lesson/ILessonController.ts
import { Request, Response } from 'express';
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

export interface ILessonController {
  // Trial
  createTrial(req: Request<{}, {}, CreateTrialLessonBody>, res: Response): Promise<void>;

  // Get
  getLesson(req: Request<LessonIdParams>, res: Response): Promise<void>;
  getUserLessons(req: Request, res: Response): Promise<void>;

  // Tutor actions
  confirm(req: Request<LessonIdParams>, res: Response): Promise<void>;
  reject(req: Request<LessonIdParams>, res: Response): Promise<void>;
  start(req: Request<LessonIdParams, {}, StartLessonBody>, res: Response): Promise<void>;
  complete(req: Request<LessonIdParams>, res: Response): Promise<void>;

  // Cancel
  cancelByClient(req: Request<LessonIdParams, {}, CancelLessonBody>, res: Response): Promise<void>;
  cancelByTutor(req: Request<LessonIdParams, {}, CancelLessonBody>, res: Response): Promise<void>;
  cancelSingleLesson(req: Request<LessonIdParams, {}, CancelLessonBody>, res: Response): Promise<void>;

  // Reschedule
  proposeReschedule(req: Request<LessonIdParams, {}, ProposeRescheduleBody>, res: Response): Promise<void>;
  acceptReschedule(req: Request<LessonIdParams>, res: Response): Promise<void>;
  declineReschedule(req: Request<LessonIdParams>, res: Response): Promise<void>;
  rescheduleByClient(req: Request<LessonIdParams, {}, RescheduleByClientBody>, res: Response): Promise<void>;

  // No-show
  markNoShowClient(req: Request<LessonIdParams>, res: Response): Promise<void>;
  markNoShowTutor(req: Request<LessonIdParams>, res: Response): Promise<void>;

  // Materials
  uploadMaterial(req: Request<LessonIdParams, {}, UploadMaterialBody>, res: Response): Promise<void>;
  getMaterials(req: Request<LessonIdParams>, res: Response): Promise<void>;
  deleteMaterial(req: Request<MaterialIdParams>, res: Response): Promise<void>;

  // Regular schedule
  createRegularSchedule(req: Request<{}, {}, CreateRegularScheduleBody>, res: Response): Promise<void>;
  cancelRegularSchedule(req: Request<ScheduleIdParams>, res: Response): Promise<void>;
}