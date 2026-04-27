import { PrismaClient } from '../../../generated/prisma';
import { IUnitOfWork } from '../../../application/ports/IUnitOfWork';

export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => {
      return work();
    });
  }
}