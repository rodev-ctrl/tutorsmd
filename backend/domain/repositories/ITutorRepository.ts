import { Tutor } from '../entities/Tutor';
 
export interface ITutorRepository {
  findById(id: string): Promise<Tutor | null>;
  findByUserId(userId: string): Promise<Tutor | null>;
  create(tutor: Tutor): Promise<void>;
  save(tutor: Tutor): Promise<void>;
  delete(id: string): Promise<void>;
}
 