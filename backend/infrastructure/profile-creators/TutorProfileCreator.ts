import { IProfileCreator } from '../../application/ports/IProfileCreator';
import { ITutorRepository } from '../../domain/repositories/ITutorRepository';
import { Tutor } from '../../domain/entities/Tutor';

export class TutorProfileFactory implements IProfileCreator {
  readonly role = 'client' as const;

  constructor(private readonly tutorRepo: ITutorRepository) {}

  async createProfile(userId: string, profileId: string): Promise<void> {
    const tutor = Tutor.create({ id: profileId, userId });
    await this.tutorRepo.create(tutor);
  }
}