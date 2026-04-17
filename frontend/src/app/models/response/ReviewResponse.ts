export interface Review {
    email: string,
    name: string,
    grade: string,
    currentReview: string
  }
  
  export interface ReviewResponse {
    message: string;
    review: Review;
  }