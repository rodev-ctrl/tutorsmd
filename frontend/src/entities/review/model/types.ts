export interface Review {
  id:              string;
  lessonId:        string;
  clientId:        string;
  tutorId:         string;
  rating:          number; // 1-5
  comment:         string | null;
  tutorResponse:   string | null;
  tutorRespondedAt: string | null;
  createdAt:       string;
}