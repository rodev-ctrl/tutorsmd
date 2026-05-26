import { Tutor } from '../entities/Tutor';
import type { TutorListFilters } from '../../application/usecases/tutor/public/GetTutorPublicListUseCase';

export interface PendingTutorResult {
  tutorId: string;
  userId: string;
  name: string;
  surname: string;
  email: string;
  nameDe: string | null;
  surnameDe: string | null;
  nameRu: string | null;
  surnameRu: string | null;
  createdAt: Date;
}

export interface TutorPublicListFilters {
  search?:  string;
  minRate?: number;
  maxRate?: number;
  page:     number;
  limit:    number;
}


export interface TutorPublicListItem {
  id:             string;
  userId:         string;
  name:           string;
  surname:        string;
  nameDe:         string | null;
  nameRu:         string | null;
  surnameDe:      string | null;
  surnameRu:      string | null;
  avatarUrl?:      string | null;
  hourlyRate:     number | null;
  ratingAvg:      number;
  ratingCount:    number;
  highlightDe:    string | null;
  highlightRu:    string | null;
  approvalStatus: string;
}

export interface ITutorRepository {
  findById(id: string): Promise<Tutor | null>;
  findByUserId(userId: string): Promise<Tutor | null>;
  findPendingWithUser(): Promise<PendingTutorResult[]>;
  findPublicList(filters: TutorListFilters): Promise<{
  tutors: 
    Array<{
      id: string; userId: string; name: string; surname: string;
      nameDe: string | null; nameRu: string | null;
      surnameDe: string | null; surnameRu: string | null;
      avatarUrl?: string | null;
      hourlyRate: number | null; ratingAvg: number; ratingCount: number;
      highlightDe: string | null; highlightRu: string | null;
      approvalStatus: string;
    }>;
    total: number;
  }>;
  create(tutor: Tutor): Promise<void>;
  save(tutor: Tutor): Promise<void>;
  delete(id: string): Promise<void>;
}