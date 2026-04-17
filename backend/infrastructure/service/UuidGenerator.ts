// infrastructure/service/UuidGenerator.ts

import { v4 as uuidv4 } from 'uuid';
import { IUUIdGenerator } from '../../application/ports/IUUIDGenerator';

export class UuidGenerator implements IUUIdGenerator {
  generate(): string {
    return uuidv4();
  }
}
