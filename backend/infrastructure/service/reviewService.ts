// reviewService.ts
import Review from '../models/reviewModel';
import Tutor from '../models/tutorModel';
import Client from '../models/clientModel';
import ApiError from '../../domain/errors/apiError';
import ReviewDto from '../dto/reviewDto';
import sequelize from '../database/db';
import { CreateReview, GetMyForTutor, ListByTutor, UpdateOwn } from '../../interfaces/interfaceReview';

export default class ReviewService {
  static async listByTutor({
    tutorId,
    limit,
    offset,
  }: ListByTutor) {
    
    const { rows, count } = await Review.findAndCountAll({
      where: { tutor_id: tutorId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { items: rows.map(r => new ReviewDto(r)), total: count };
  }

  static async getMyForTutor({ tutorId, userId }: GetMyForTutor) {
    const review = await Review.findOne({ where: { tutor_id: tutorId, user_id: userId } });

    return review;
  }


  static async create({
    tutorId,
    userId,
    grade,
    comment,
  }: CreateReview): Promise<Review> {
    try {
      if (grade < 1 || grade > 5) throw ApiError.BadRequest('Invalid grade');

      // TRANSACTION - обеспечиваем именно такую последовательность операций
      return sequelize.transaction(async (t) => {
        const tutor = await Tutor.findByPk(tutorId);
        if (!tutor) throw ApiError.NotFound('Tutor not found');
    
        const exists = await Review.findOne({ where: { tutor_id: tutorId, user_id: userId } });
        if (exists) throw ApiError.BadRequest('Review already exists');
    
        const userCheck = await Client.findByPk(userId, { transaction: t });
        if (!userCheck) throw ApiError.NotFound('User not found');
    
        const review = await Review.create({
            tutor_id: tutorId,
            user_id: userId,
            first_name: userCheck.name,
            last_name: userCheck.surname,
            grade,
            comment,
        }, {transaction: t});

        const newCount = tutor.rating_count + 1;
    const newAvg =
      (Number(tutor.rating_avg) * tutor.rating_count + grade) / newCount;

    tutor.rating_count = newCount;
    tutor.rating_avg = Number(newAvg.toFixed(2));

    await tutor.save({ transaction: t });

    return review;
      })

    } catch(e: any) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        throw ApiError.BadRequest('Review already exists');
      }

      throw e instanceof ApiError ? e : ApiError.Internal("Review created failed");
    }
   
  }

  static async updateOwn({ 
    reviewId, userId, grade, comment 
  }: UpdateOwn): Promise<Review> {
    return sequelize.transaction(async (t) => {
      const review = await Review.findOne({
        where: { id: reviewId, user_id: userId },
        transaction: t,
      });
      if (!review) throw ApiError.NotFound('Review not found');
  
      const tutor = await Tutor.findByPk(review.tutor_id, { transaction: t });
      if (!tutor) throw ApiError.NotFound('Tutor not found');
  
      if (grade !== undefined) {
        if (grade < 1 || grade > 5) {
          throw ApiError.BadRequest('Invalid grade');
        }
  
        const oldGrade = review.grade;
  
        const newAvg =
          (Number(tutor.rating_avg) * tutor.rating_count -
            oldGrade +
            grade) /
          tutor.rating_count;
  
        tutor.rating_avg = Number(newAvg.toFixed(2));
        review.grade = grade;
      }
  
      if (comment !== undefined) {
        review.comment = comment;
      }
  
      await review.save({ transaction: t });
      await tutor.save({ transaction: t });
  
      return review;
    });
  }
  
}
