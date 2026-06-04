import { ITutorRepository } from '../../../../domain/repositories/ITutorRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { DomainError } from '../../../../domain/errors/DomainError';
import { PrismaClient } from '@prisma/client';

export class GetTutorPublicProfileUseCase {
  constructor(
    private readonly tutorRepo: ITutorRepository,
    private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(tutorId: string) {
    const tutor = await this.tutorRepo.findById(tutorId);
    if (!tutor) throw new NotFoundError('Tutor not found');
    if (!tutor.isApproved) throw new DomainError('Tutor profile is not public');

    const user = await this.userRepo.findById(tutor.userId);
    if (!user) throw new NotFoundError('User not found');

    const tutorSubjects = await this.prisma.tutorSubject.findMany({
      where: { tutorId: tutor.id },
      include: { subject: true },
    });

    return {
      id: tutor.id,
      userId: tutor.userId,
      name: user.name,
      surname: user.surname,
      avatarUrl: user.avatarUrl,
      nameDe: tutor.nameDe,
      nameRu: tutor.nameRu,
      surnameDe: tutor.surnameDe,
      surnameRu: tutor.surnameRu,
      hourlyRate: tutor.hourlyRate,
      ratingAvg: tutor.ratingAvg,
      ratingCount: tutor.ratingCount,
      highlightDe: tutor.highlightDe,
      highlightRu: tutor.highlightRu,
      fulldescribeDe: tutor.fulldescribeDe,
      fulldescribeRu: tutor.fulldescribeRu,
      subjects: tutorSubjects.map(ts => ({
        id: ts.subject.id,
        name: ts.subject.name,
      })),
    };
  }
}