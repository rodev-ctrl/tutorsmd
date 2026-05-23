import { Prisma, PrismaClient } from '../../../../generated/prisma';
import { IQuizRepository } from '../../../../domain/repositories/quiz/IQuizRepository';
import { Quiz } from '../../../../domain/entities/quiz/Quiz';

type QuizRecord = Prisma.QuizGetPayload<{}>;

export class PrismaQuizRepository implements IQuizRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Quiz | null> {
    const record = await this.prisma.quiz.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByTutorId(tutorId: string): Promise<Quiz[]> {
    const records = await this.prisma.quiz.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.toDomain(r));
  }

  async create(quiz: Quiz): Promise<void> {
    await this.prisma.quiz.create({
      data: {
        id: quiz.id,
        tutorId: quiz.tutorId,
        subjectId: quiz.subjectId,
        title: quiz.title,
        description: quiz.description,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
      },
    });
  }

  async save(quiz: Quiz): Promise<void> {
    await this.prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        title: quiz.title,
        description: quiz.description,
        updatedAt: quiz.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.quiz.delete({ where: { id } });
  }

  private toDomain(record: QuizRecord): Quiz {
    return Quiz.restore({
      id: record.id,
      tutorId: record.tutorId,
      subjectId: record.subjectId,
      title: record.title,
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}