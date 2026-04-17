// reviewController.ts
import { RequestHandler } from 'express';
import ReviewService from '../../infrastructure/service/reviewService';
import ReviewDto from '../../dto/reviewDto';
import ApiError from '../../domain/errors/apiError';

export class ReviewController {
  static listByTutor: RequestHandler = async(req, res) => {
    const tutorId = Number(req.params.tutorId);
    if (!Number.isInteger(tutorId)) {
      throw ApiError.BadRequest('Invalid tutorId');
    }
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const data = await ReviewService.listByTutor({ tutorId, limit, offset });
    res.json({ ok: true, ...data });
  }

  static getMyForTutor: RequestHandler = async(req, res) => {
    console.log("GEEEETTTT MY FOR TUTOR");
    if (!req.user) {
      throw ApiError.Unauthorized('Not authenticated');
    }
    const tutorId = Number(req.params.tutorId);
    console.log("GEEEETTTT MY FOR TUTOR DATA");
    console.log(req.user);
    console.log(tutorId);
    if (!Number.isInteger(tutorId)) {
      throw ApiError.BadRequest('Invalid tutorId');
    }
    const userId = req.user.id;

    console.log(userId);
    const review = await ReviewService.getMyForTutor({ tutorId, userId });
    console.log(review);
    
    if(!review) return;
    const reviewDTO = new ReviewDto(review);
    console.log("DTO");
    console.log(reviewDTO);
    res.json({ ok: true, review: reviewDTO });
  }

  static createForTutor: RequestHandler = async(req, res) => {
    console.log("create");
    if (!req.user) {
      throw ApiError.Unauthorized('Not authenticated');
    }
    const tutorId = Number(req.params.tutorId);
    if (!Number.isInteger(tutorId)) {
      throw ApiError.BadRequest('Invalid tutorId');
    }
    const { grade, comment } = req.body;
    const userId = req.user.id;

    const review = await ReviewService.create({ tutorId, userId, grade, comment });
    if (!review) {
      res.status(404).json({ message: 'Review not created' });
      return;
    }
    res.status(201).json({ ok: true, review: new ReviewDto(review) });
  }

  static updateOwn: RequestHandler = async(req, res) => {
    console.log("EDIT REVIEW");
    console.log(req.body);
    console.log(req.user);
    console.log(req.params);
    if (!req.user) {
      throw ApiError.Unauthorized('Not authenticated');
    }
    const reviewId = Number(req.params.reviewId);
    if (!Number.isInteger(reviewId)) {
      throw ApiError.BadRequest('Invalid tutorId');
    }
    const { grade, comment } = req.body;
    if (grade !== undefined && (grade < 1 || grade > 5)) {
      throw ApiError.BadRequest('Invalid grade');
    }
    
    const userId = req.user.id;

    const review = await ReviewService.updateOwn({ reviewId, userId, grade, comment });
    res.json({ ok: true, review: new ReviewDto(review) });
  }
}
