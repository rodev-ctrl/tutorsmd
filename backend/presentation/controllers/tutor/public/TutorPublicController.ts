import { Request, Response }            from 'express';
import { ITutorPublicController }       from './ITutorPublicController';
import { GetTutorPublicListUseCase }    from '../../../../application/usecases/tutor/public/GetTutorPublicListUseCase';
import { GetTutorPublicProfileUseCase } from '../../../../application/usecases/tutor/public/GetTutorPublicProfileUseCase';
import type { TutorIdParams } from './tutor-public.schema';

export class TutorPublicController implements ITutorPublicController {
  constructor(
    private readonly getListUseCase:    GetTutorPublicListUseCase,
    private readonly getProfileUseCase: GetTutorPublicProfileUseCase,
  ) {}

  // GET /api/tutors?search=&minRate=&maxRate=&page=&limit=
  async getPublicList(
    req: Request,
    res: Response,
  ): Promise<void> {
    const q = req.query as Record<string, string | undefined>;

    const result = await this.getListUseCase.execute({
      search:  q.search  ? String(q.search)  : undefined,
      minRate: q.minRate ? Number(q.minRate) : undefined,
      maxRate: q.maxRate ? Number(q.maxRate) : undefined,
      page:    q.page    ? Number(q.page)    : 1,
      limit:   q.limit   ? Number(q.limit)   : 12,
    });

    res.status(200).json(result);
  }

  // GET /api/tutors/:tutorId
  async getPublicProfile(
    req: Request<TutorIdParams>,
    res: Response,
  ): Promise<void> {
    const { tutorId } = req.params;

    const profile = await this.getProfileUseCase.execute(tutorId);
    res.status(200).json(profile);
  }
}