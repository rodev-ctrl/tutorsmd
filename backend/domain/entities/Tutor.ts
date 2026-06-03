import { DomainError } from '../errors/DomainError';

export type ApprovalStatus = 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';

interface TutorProps {
  id: string;
  userId: string;
  fulldescribeDe: string | null;
  fulldescribeRu: string | null;
  hourlyRate: number | null;
  nameDe: string | null;
  nameRu: string | null;
  surnameDe: string | null;
  surnameRu: string | null;
  highlightDe: string | null;
  highlightRu: string | null;
  ratingAvg: number;
  ratingCount: number;
  approvalStatus: ApprovalStatus;
  approvedAt: Date | null;
  approvedBy: string | null; // userId админа
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateTutorProps {
  id: string;
  userId: string;
  fulldescribeDe?: string | null;
  fulldescribeRu?: string | null;
  hourlyRate?: number | null;
  nameDe?: string | null;
  nameRu?: string | null;
  surnameDe?: string | null;
  surnameRu?: string | null;
  highlightDe?: string | null;
  highlightRu?: string | null;
}

export interface UpdateTutorProps {
  fulldescribeDe?: string | null;
  fulldescribeRu?: string | null;
  highlightDe?: string | null;
  highlightRu?: string | null;
  nameDe?: string | null;
  nameRu?: string | null;
  surnameDe?: string | null;
  surnameRu?: string | null;
  hourlyRate?: number | null;
}

interface RestoreTutorProps {
  id: string;
  userId: string;
  fulldescribeDe: string | null;
  fulldescribeRu: string | null;
  hourlyRate: number | null;
  nameDe: string | null;
  nameRu: string | null;
  surnameDe: string | null;
  surnameRu: string | null;
  highlightDe: string | null;
  highlightRu: string | null;
  ratingAvg: number;
  ratingCount: number;
  approvalStatus: ApprovalStatus;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Tutor {
  private readonly props: TutorProps;

  private constructor(props: TutorProps) {
    this.props = props;
  }



  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get fulldescribeDe(): string | null { return this.props.fulldescribeDe; }
  get fulldescribeRu(): string | null { return this.props.fulldescribeRu; }
  get hourlyRate(): number | null { return this.props.hourlyRate; }
  get nameDe(): string | null { return this.props.nameDe; }
  get nameRu(): string | null { return this.props.nameRu; }
  get surnameDe(): string | null { return this.props.surnameDe; }
  get surnameRu(): string | null { return this.props.surnameRu; }
  get highlightDe(): string | null { return this.props.highlightDe; }
  get highlightRu(): string | null { return this.props.highlightRu; }
  get ratingAvg(): number { return this.props.ratingAvg; }
  get ratingCount(): number { return this.props.ratingCount; }
  get approvalStatus(): ApprovalStatus { return this.props.approvalStatus; }
  get approvedAt(): Date | null {
    return this.props.approvedAt ? new Date(this.props.approvedAt) : null;
  }
  get approvedBy(): string | null { return this.props.approvedBy; }
  get rejectionReason(): string | null { return this.props.rejectionReason; }
  get createdAt(): Date { return new Date(this.props.createdAt); }
  get updatedAt(): Date { return new Date(this.props.updatedAt); }

  // Computed
  get isApproved(): boolean { return this.props.approvalStatus === 'approved'; }
  get isPending(): boolean { return this.props.approvalStatus === 'pending'; }
  get isRejected(): boolean { return this.props.approvalStatus === 'rejected'; }

 

  // Обновление профиля — один вызов для всех полей (по аналогии с User.update)
  update(props: UpdateTutorProps): Tutor {
    if (props.fulldescribeDe !== undefined && props.fulldescribeDe !== null) {
      Tutor.validateDescription(props.fulldescribeDe, 'Description DE');
    }
    if (props.fulldescribeRu !== undefined && props.fulldescribeRu !== null) {
      Tutor.validateDescription(props.fulldescribeRu, 'Description RU');
    }
    if (props.highlightDe !== undefined && props.highlightDe !== null) {
      Tutor.validateHighlight(props.highlightDe, 'Highlight DE');
    }
    if (props.highlightRu !== undefined && props.highlightRu !== null) {
      Tutor.validateHighlight(props.highlightRu, 'Highlight RU');
    }
    if (props.hourlyRate !== undefined && props.hourlyRate !== null) {
      Tutor.validateHourlyRate(props.hourlyRate);
    }

    return new Tutor({
      ...this.props,
      fulldescribeDe: props.fulldescribeDe !== undefined
        ? props.fulldescribeDe
        : this.props.fulldescribeDe,
      fulldescribeRu: props.fulldescribeRu !== undefined
        ? props.fulldescribeRu
        : this.props.fulldescribeRu,
      highlightDe: props.highlightDe !== undefined
        ? props.highlightDe
        : this.props.highlightDe,
      highlightRu: props.highlightRu !== undefined
        ? props.highlightRu
        : this.props.highlightRu,
      nameDe: props.nameDe !== undefined ? props.nameDe : this.props.nameDe,
      nameRu: props.nameRu !== undefined ? props.nameRu : this.props.nameRu,
      surnameDe: props.surnameDe !== undefined ? props.surnameDe : this.props.surnameDe,
      surnameRu: props.surnameRu !== undefined ? props.surnameRu : this.props.surnameRu,
      hourlyRate: props.hourlyRate !== undefined
        ? props.hourlyRate
        : this.props.hourlyRate,
      updatedAt: new Date(),
    });
  }

  
  approve(adminUserId: string): Tutor {
    if (this.isApproved) {
      throw new DomainError('Tutor is already approved');
    }
    return new Tutor({
      ...this.props,
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedBy: adminUserId,
      updatedAt: new Date(),
    });
  }

  submit(): Tutor {
  if (this.props.approvalStatus !== 'pending' && this.props.approvalStatus !== 'rejected') {
    throw new DomainError('Only pending or rejected tutors can submit');
  }
  return new Tutor({
    ...this.props,
    approvalStatus: 'submitted',
    rejectionReason: null,
    updatedAt: new Date(),
  });
}

startReview(): Tutor {
  if (this.props.approvalStatus !== 'submitted') {
    throw new DomainError('Only submitted tutors can be under review');
  }
  return new Tutor({
    ...this.props,
    approvalStatus: 'under_review',
    updatedAt: new Date(),
  });
}

  reject(reason?: string): Tutor {
    if (this.isRejected) {
      throw new DomainError('Tutor is already rejected');
    }
    return new Tutor({
      ...this.props,
      approvalStatus: 'rejected',
      rejectionReason: reason ?? null,
      approvedAt: null,
      approvedBy: null,
      updatedAt: new Date(),
    });
  }

  reapply(): Tutor {
    if (!this.isRejected) {
      throw new DomainError('Only rejected tutors can reapply');
    }
    return new Tutor({
      ...this.props,
      approvalStatus: 'pending',
      updatedAt: new Date(),
    });
  }

  // Rating — вызывается только из use case после сохранения нового Review
  updateRating(newAvg: number, newCount: number): Tutor {
    if (newAvg < 0 || newAvg > 5) {
      throw new DomainError('Rating avg must be between 0 and 5');
    }
    if (newCount < 0) {
      throw new DomainError('Rating count cannot be negative');
    }
    return new Tutor({
      ...this.props,
      ratingAvg: newAvg,
      ratingCount: newCount,
      updatedAt: new Date(),
    });
  }

  

  private static validateDescription(text: string, field: string): void {
    if (text.length > 5000) {
      throw new DomainError(`${field} must not exceed 5000 characters`);
    }
  }

  private static validateHighlight(text: string, field: string): void {
    if (text.length > 500) {
      throw new DomainError(`${field} must not exceed 500 characters`);
    }
  }

  private static validateHourlyRate(rate: number): void {
    if (rate <= 0) throw new DomainError('Hourly rate must be positive');
    if (rate > 10000) throw new DomainError('Hourly rate is unrealistic');
  }

  // --- Factory methods ---

  static create(props: CreateTutorProps): Tutor {
    const now = new Date();
    return new Tutor({
      id: props.id,
      userId: props.userId,
      fulldescribeDe: props.fulldescribeDe ?? null,
      fulldescribeRu: props.fulldescribeRu ?? null,
      hourlyRate: props.hourlyRate ?? null,
      nameDe: props.nameDe ?? null,
      nameRu: props.nameRu ?? null,
      surnameDe: props.surnameDe ?? null,
      surnameRu: props.surnameRu ?? null,
      highlightDe: props.highlightDe ?? null,
      highlightRu: props.highlightRu ?? null,
      ratingAvg: 0,
      ratingCount: 0,
      approvalStatus: 'pending',
      rejectionReason: null,
      approvedAt: null,
      approvedBy: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Восстановление из БД — конвертация Decimal → number
  static restore(props: RestoreTutorProps): Tutor {
    return new Tutor({
      id: props.id,
      userId: props.userId,
      fulldescribeDe: props.fulldescribeDe ?? null,
      fulldescribeRu: props.fulldescribeRu ?? null,
      highlightDe: props.highlightDe ?? null,
      highlightRu: props.highlightRu ?? null,
      nameDe: props.nameDe,
      nameRu: props.nameRu,
      surnameDe: props.surnameDe,
      surnameRu: props.surnameRu,
      hourlyRate: props.hourlyRate !== null ? Number(props.hourlyRate) : null,
      ratingAvg: Number(props.ratingAvg),
      ratingCount: props.ratingCount,
      approvalStatus: props.approvalStatus,
      approvedAt: props.approvedAt ? new Date(props.approvedAt) : null,
      approvedBy: props.approvedBy,
      rejectionReason: null,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }
}