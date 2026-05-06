import { Role } from '../../domain/entities/User';
 
export interface IProfileCreator {
  readonly role: Role;
  createProfile(userId: string, profileId: string): Promise<void>;
}
 
