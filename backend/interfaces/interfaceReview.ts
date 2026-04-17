export interface ListByTutor {
    tutorId: number;
    limit?: number;
    offset?: number;
}

export interface GetMyForTutor {
    tutorId: number; 
    userId: number
  }
export interface CreateReview {
    tutorId: number;
    userId: number;
    grade: number;
    comment: string;
  }
export interface UpdateOwn {
    reviewId: number;
    userId: number;
    grade: number;
    comment: string;
  }