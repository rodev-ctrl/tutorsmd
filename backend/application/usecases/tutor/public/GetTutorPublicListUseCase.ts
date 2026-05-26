import {
  ITutorRepository,
  TutorPublicListFilters,
  TutorPublicListItem,
} from '../../../../domain/repositories/ITutorRepository';

export interface TutorListResult {
  tutors: TutorPublicListItem[];
  total:  number;
  page:   number;
}

export type TutorListFilters = TutorPublicListFilters;


export class GetTutorPublicListUseCase {
  constructor(private readonly tutorRepo: ITutorRepository) {}

  async execute(filters: TutorPublicListFilters): Promise<TutorListResult> {
    const { tutors, total } = await this.tutorRepo.findPublicList(filters);
    return { tutors: tutors, total, page: filters.page };
  }
}