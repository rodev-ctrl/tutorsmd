import { UUID } from '../../domain/value-objects/UserId';

export interface IUUIDGenerator {
  generate(): UUID;
}