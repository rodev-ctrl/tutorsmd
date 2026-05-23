export interface ReviewProps {
  id:                string;
  lessonId:          string;
  clientId:          string;
  tutorId:           string;
  rating:            number;
  comment:           string | null;
  tutorResponse:     string | null;
  tutorRespondedAt:  Date | null;
  createdAt:         Date;
  updatedAt:         Date;
}

export class Review {
  private constructor(private readonly props: ReviewProps) {}

  static create(props: Omit<ReviewProps, 'tutorResponse' | 'tutorRespondedAt' | 'createdAt' | 'updatedAt'>): Review {
    if (props.rating < 1 || props.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    const now = new Date();
    return new Review({
      ...props,
      tutorResponse:    null,
      tutorRespondedAt: null,
      createdAt:        now,
      updatedAt:        now,
    });
  }

  static reconstitute(props: ReviewProps): Review {
    return new Review(props);
  }

  get id():               string      { return this.props.id; }
  get lessonId():         string      { return this.props.lessonId; }
  get clientId():         string      { return this.props.clientId; }
  get tutorId():          string      { return this.props.tutorId; }
  get rating():           number      { return this.props.rating; }
  get comment():          string|null { return this.props.comment; }
  get tutorResponse():    string|null { return this.props.tutorResponse; }
  get tutorRespondedAt(): Date|null   { return this.props.tutorRespondedAt; }
  get createdAt():        Date        { return this.props.createdAt; }
  get updatedAt():        Date        { return this.props.updatedAt; }
}