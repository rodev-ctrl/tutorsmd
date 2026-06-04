import { TutorSubject } from "@shared/api/tutor/tutorApi";

export type ApprovalStatus = 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface TutorPublic {
  id:             string;
  userId:         string;
  name:           string;
  surname:        string;
  nameDe:         string | null;
  nameRu:         string | null;
  surnameDe:      string | null;
  surnameRu:      string | null;
  avatarUrl:      string | null;
  hourlyRate:     number | null;
  ratingAvg:      number;
  ratingCount:    number;
  highlightDe:    string | null;
  highlightRu:    string | null;
  fulldescribeDe: string | null;
  fulldescribeRu: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  subjects: TutorSubject[];
}