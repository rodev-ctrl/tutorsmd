import { Review } from '../entities/Review';

export interface ReviewRecord {
  id:               string;
  lessonId:         string;
  clientId:         string;
  tutorId:          string;
  rating:           number;
  comment:          string | null;
  tutorResponse:    string | null;
  tutorRespondedAt: Date | null;
  createdAt:        Date;
}

export interface GetTutorReviewsOptions {
  tutorId:  string;
  limit?:   number;
  before?:  Date; 
}

export interface IReviewRepository {
  create(review: Review): Promise<void>;
  existsByClientAndTutor(clientId: string, tutorId: string): Promise<boolean>;
  findByTutorId(options: GetTutorReviewsOptions): Promise<ReviewRecord[]>;
}