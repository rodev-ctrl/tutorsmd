 export interface IFeedbackRepository {
  create(data: { id: string; userId: string; text: string }): Promise<void>;
}