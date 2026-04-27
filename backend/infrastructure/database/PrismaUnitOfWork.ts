import { PrismaClient } from '../../../generated/prisma';
import { IUnitOfWork, TransactionClient } from '../../application/ports/IUnitOfWork';

export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  async run<T>(work: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx: any) => {
      return work(tx);
    });
  }
}