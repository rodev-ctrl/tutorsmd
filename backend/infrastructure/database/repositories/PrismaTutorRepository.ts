// infrastructure/database/repositories/PrismaTutorRepository.ts

import { PrismaClient } from '../../../../generated/prisma';
import { ITutorRepository } from '../../../domain/repositories/ITutorRepository';
import { Tutor, ApprovalStatus } from '../../../domain/entities/Tutor';

export class PrismaTutorRepository implements ITutorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Tutor | null> {
    const record = await this.prisma.tutor.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUserId(userId: string): Promise<Tutor | null> {
    const record = await this.prisma.tutor.findUnique({ where: { userId } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async create(tutor: Tutor): Promise<void> {
    await this.prisma.tutor.create({
      data: {
        id: tutor.id,
        userId: tutor.userId,
        avatarUrl: tutor.avatarUrl,
        fulldescribeDe: tutor.fulldescribeGe,
        fulldescribeRu: tutor.fulldescribeRu,
        highlightDe: tutor.highlightDe,
        highlightRu: tutor.highlightRu,
        hourlyRate: tutor.hourlyRate,
        ratingAvg: tutor.ratingAvg,
        ratingCount: tutor.ratingCount,
        nameDe: tutor.nameDe,
        nameRu: tutor.nameRu,
        surnameDe: tutor.surnameDe,
        surnameRu: tutor.surnameRu,
        approvalStatus: tutor.approvalStatus,
        approvedAt: tutor.approvedAt,
        approvedBy: tutor.approvedBy,
        createdAt: tutor.createdAt,
        updatedAt: tutor.updatedAt,
      },
    });
  }

  async save(tutor: Tutor): Promise<void> {
    await this.prisma.tutor.update({
      where: { id: tutor.id },
      data: {
        avatarUrl: tutor.avatarUrl,
        fulldescribeDe: tutor.fulldescribeGe,
        fulldescribeRu: tutor.fulldescribeRu,
        highlightDe: tutor.highlightDe,
        highlightRu: tutor.highlightRu,
        hourlyRate: tutor.hourlyRate,
        ratingAvg: tutor.ratingAvg,
        ratingCount: tutor.ratingCount,
        nameDe: tutor.nameDe,
        nameRu: tutor.nameRu,
        surnameDe: tutor.surnameDe,
        surnameRu: tutor.surnameRu,
        approvalStatus: tutor.approvalStatus,
        approvedAt: tutor.approvedAt,
        approvedBy: tutor.approvedBy,
        updatedAt: tutor.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tutor.delete({ where: { id } });
  }

  private toDomain(record: any): Tutor {
  return Tutor.restore({
    id: record.id,
    userId: record.userId,
    avatarUrl: record.avatarUrl,
    fulldescribeDe: record.fulldescribeDe,
    fulldescribeRu: record.fulldescribeRu,
    highlightDe: record.highlightDe,
    highlightRu: record.highlightRu,
    nameDe: record.nameDe,         
    nameRu: record.nameRu,         
    surnameDe: record.surnameDe,   
    surnameRu: record.surnameRu,   
    hourlyRate: Number(record.hourlyRate),
    ratingAvg: Number(record.ratingAvg),
    ratingCount: record.ratingCount,
    approvalStatus: record.approvalStatus as ApprovalStatus,
    approvedAt: record.approvedAt,
    approvedBy: record.approvedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
}