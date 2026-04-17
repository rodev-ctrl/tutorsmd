import ApiError from '../exceptions/apiError';
import { ReviewAttributes } from '../interfaces/InterfacesModels';

export default class ReviewDto {
  id: number;
  tutor_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  grade: number;
  comment: string;

  constructor(model: ReviewAttributes) {
    if (!model) {
      throw ApiError.NotFound('Review not found');
    }

    this.id = model.id;
    this.tutor_id = model.tutor_id;
    this.user_id = model.user_id;
    this.first_name = model.first_name;
    this.last_name = model.last_name;
    this.grade = model.grade;
    this.comment = model.comment;
  }
}
