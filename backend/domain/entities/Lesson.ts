// domain/entities/Lesson.ts
import { DomainError } from '../errors/DomainError';

export type LessonType = 'trial' | 'regular';

export type LessonStatus =
  | 'pending'
  | 'pending_reschedule'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_client'
  | 'cancelled_by_tutor'
  | 'rescheduled'
  | 'no_show_client'
  | 'no_show_tutor';

interface LessonProps {
  id: string;
  clientId: string;
  tutorId: string;
  subjectId: string;
  type: LessonType;
  status: LessonStatus;
  scheduledAt: Date;
  durationMinutes: number;
  recurringScheduleId: string | null;
  rescheduledFromId: string | null;
  roomId: string | null;
  cancellationReason: string | null;
  proposedScheduledAt: Date | null;
  proposedExpiresAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateLessonProps {
  id: string;
  clientId: string;
  tutorId: string;
  subjectId: string;
  type: LessonType;
  scheduledAt: Date;
  durationMinutes?: number;
  recurringScheduleId?: string | null;
  rescheduledFromId?: string | null;
}

interface RestoreLessonProps extends LessonProps {}

const MIN_LESSON_HOURS = 2;
const NO_SHOW_WINDOW_MIN_MINUTES = 15;
const NO_SHOW_WINDOW_MAX_HOURS = 24;
const START_WINDOW_MINUTES = 5;

export class Lesson {
  private readonly props: LessonProps;

  private constructor(props: LessonProps) {
    this.props = props;
  }

  // --- Getters ---

  get id(): string { return this.props.id; }
  get clientId(): string { return this.props.clientId; }
  get tutorId(): string { return this.props.tutorId; }
  get subjectId(): string { return this.props.subjectId; }
  get type(): LessonType { return this.props.type; }
  get status(): LessonStatus { return this.props.status; }
  get scheduledAt(): Date { return new Date(this.props.scheduledAt); }
  get durationMinutes(): number { return this.props.durationMinutes; }
  get recurringScheduleId(): string | null { return this.props.recurringScheduleId; }
  get rescheduledFromId(): string | null { return this.props.rescheduledFromId; }
  get roomId(): string | null { return this.props.roomId; }
  get cancellationReason(): string | null { return this.props.cancellationReason; }
  get proposedScheduledAt(): Date | null {
    return this.props.proposedScheduledAt ? new Date(this.props.proposedScheduledAt) : null;
  }
  get proposedExpiresAt(): Date | null {
    return this.props.proposedExpiresAt ? new Date(this.props.proposedExpiresAt) : null;
  }
  get startedAt(): Date | null {
    return this.props.startedAt ? new Date(this.props.startedAt) : null;
  }
  get completedAt(): Date | null {
    return this.props.completedAt ? new Date(this.props.completedAt) : null;
  }
  get createdAt(): Date { return new Date(this.props.createdAt); }
  get updatedAt(): Date { return new Date(this.props.updatedAt); }

  // --- Status checks ---

  get isTrial(): boolean { return this.props.type === 'trial'; }
  get isRegular(): boolean { return this.props.type === 'regular'; }
  get isPending(): boolean { return this.props.status === 'pending'; }
  get isPendingReschedule(): boolean { return this.props.status === 'pending_reschedule'; }
  get isConfirmed(): boolean { return this.props.status === 'confirmed'; }
  get isInProgress(): boolean { return this.props.status === 'in_progress'; }
  get isCompleted(): boolean { return this.props.status === 'completed'; }
  get isCancelled(): boolean {
    return this.props.status === 'cancelled_by_client' ||
           this.props.status === 'cancelled_by_tutor';
  }
  get isRescheduled(): boolean { return this.props.status === 'rescheduled'; }
  get isTerminal(): boolean {
    return [
      'completed',
      'cancelled_by_client',
      'cancelled_by_tutor',
      'rescheduled',
      'no_show_client',
      'no_show_tutor',
    ].includes(this.props.status);
  }

  // --- Capability checks ---

  canBeCancelledByClient(): boolean {
    return this.isConfirmed && !this.isWithinModificationWindow();
  }

  canBeRescheduled(): boolean {
    return this.isConfirmed && !this.isWithinModificationWindow();
  }

  canBeStarted(): boolean {
    if (!this.isConfirmed) return false;
    const windowStart = new Date(
      this.props.scheduledAt.getTime() - START_WINDOW_MINUTES * 60 * 1000
    );
    return new Date() >= windowStart;
  }

  // --- Business methods ---

  confirm(): Lesson {
    if (!this.isPending) {
      throw new DomainError('Only pending lessons can be confirmed');
    }
    return new Lesson({
      ...this.props,
      status: 'confirmed',
      updatedAt: new Date(),
    });
  }

  start(roomId: string): Lesson {
    if (!this.isConfirmed) {
      throw new DomainError('Only confirmed lessons can be started');
    }
    if (!this.canBeStarted()) {
      throw new DomainError(
        `Lesson can only be started ${START_WINDOW_MINUTES} minutes before scheduled time`
      );
    }
    if (!roomId || roomId.trim().length === 0) {
      throw new DomainError('Room ID is required to start a lesson');
    }
    return new Lesson({
      ...this.props,
      status: 'in_progress',
      roomId: roomId.trim(),
      startedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  complete(): Lesson {
    if (!this.isInProgress) {
      throw new DomainError('Only in_progress lessons can be completed');
    }
    return new Lesson({
      ...this.props,
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  cancelByClient(reason?: string): Lesson {
    if (!this.isConfirmed) {
      throw new DomainError('Only confirmed lessons can be cancelled by client');
    }
    if (this.isWithinModificationWindow()) {
      throw new DomainError(
        `Cannot cancel less than ${MIN_LESSON_HOURS} hours before the lesson`
      );
    }
    return new Lesson({
      ...this.props,
      status: 'cancelled_by_client',
      cancellationReason: reason ?? null,
      updatedAt: new Date(),
    });
  }

  cancelByTutor(reason?: string): Lesson {
    if (!this.isConfirmed && !this.isPending) {
      throw new DomainError('Only pending or confirmed lessons can be cancelled by tutor');
    }
    return new Lesson({
      ...this.props,
      status: 'cancelled_by_tutor',
      cancellationReason: reason ?? null,
      updatedAt: new Date(),
    });
  }

  reschedule(): Lesson {
    if (!this.isConfirmed && !this.isPendingReschedule) {
      throw new DomainError(
        'Only confirmed or pending_reschedule lessons can be rescheduled'
      );
    }
    if (this.isConfirmed && this.isWithinModificationWindow()) {
      throw new DomainError(
        `Cannot reschedule less than ${MIN_LESSON_HOURS} hours before the lesson`
      );
    }
    return new Lesson({
      ...this.props,
      status: 'rescheduled',
      proposedScheduledAt: null,
      proposedExpiresAt: null,
      updatedAt: new Date(),
    });
  }

  proposeReschedule(proposedAt: Date, expiresAt: Date): Lesson {
    if (!this.isConfirmed) {
      throw new DomainError('Only confirmed lessons can be proposed for reschedule');
    }
    return new Lesson({
      ...this.props,
      status: 'pending_reschedule',
      proposedScheduledAt: proposedAt,
      proposedExpiresAt: expiresAt,
      updatedAt: new Date(),
    });
  }

  declineReschedule(): Lesson {
    if (!this.isPendingReschedule) {
      throw new DomainError('No pending reschedule proposal');
    }
    return new Lesson({
      ...this.props,
      status: 'confirmed',
      proposedScheduledAt: null,
      proposedExpiresAt: null,
      updatedAt: new Date(),
    });
  }

  markNoShowClient(): Lesson {
    if (!this.isInProgress && !this.isConfirmed) {
      throw new DomainError('Cannot mark no-show for this lesson status');
    }
    const now = new Date();
    const windowStart = new Date(
      this.props.scheduledAt.getTime() + NO_SHOW_WINDOW_MIN_MINUTES * 60 * 1000
    );
    const windowEnd = new Date(
      this.props.scheduledAt.getTime() + NO_SHOW_WINDOW_MAX_HOURS * 60 * 60 * 1000
    );
    if (now < windowStart) {
      throw new DomainError(
        `Too early to mark no-show. Wait at least ${NO_SHOW_WINDOW_MIN_MINUTES} minutes`
      );
    }
    if (now > windowEnd) {
      throw new DomainError(
        `No-show window expired (${NO_SHOW_WINDOW_MAX_HOURS} hours after scheduled time)`
      );
    }
    return new Lesson({
      ...this.props,
      status: 'no_show_client',
      updatedAt: new Date(),
    });
  }

  markNoShowTutor(): Lesson {
    if (!this.isInProgress && !this.isConfirmed) {
      throw new DomainError('Cannot mark no-show for this lesson status');
    }
    return new Lesson({
      ...this.props,
      status: 'no_show_tutor',
      updatedAt: new Date(),
    });
  }

  autoComplete(): Lesson {
    if (!this.isInProgress && !this.isConfirmed) {
      throw new DomainError('Cannot auto-complete lesson with this status');
    }
    const expectedEnd = new Date(
      this.props.scheduledAt.getTime() + this.props.durationMinutes * 60 * 1000
    );
    if (new Date() < expectedEnd) {
      throw new DomainError('Lesson has not ended yet');
    }
    return new Lesson({
      ...this.props,
      status: 'completed',
      completedAt: expectedEnd,
      updatedAt: new Date(),
    });
  }

  // --- Private helpers ---

  private isWithinModificationWindow(): boolean {
    const windowMs = MIN_LESSON_HOURS * 60 * 60 * 1000;
    return Date.now() > this.props.scheduledAt.getTime() - windowMs;
  }

  // --- Factory methods ---

  static create(props: CreateLessonProps): Lesson {
    if (props.clientId === props.tutorId) {
      throw new DomainError('Client and tutor cannot be the same person');
    }

    const minScheduledAt = new Date(Date.now() + MIN_LESSON_HOURS * 60 * 60 * 1000);
    if (props.scheduledAt < minScheduledAt) {
      throw new DomainError(
        `Lesson must be scheduled at least ${MIN_LESSON_HOURS} hours in advance`
      );
    }

    if (props.durationMinutes !== undefined && props.durationMinutes <= 0) {
      throw new DomainError('Duration must be positive');
    }

    const now = new Date();
    return new Lesson({
      id: props.id,
      clientId: props.clientId,
      tutorId: props.tutorId,
      subjectId: props.subjectId,
      type: props.type,
      status: 'pending',
      scheduledAt: props.scheduledAt ?? null,
      durationMinutes: props.durationMinutes ?? 60,
      recurringScheduleId: props.recurringScheduleId ?? null,
      rescheduledFromId: props.rescheduledFromId ?? null,
      roomId: null,
      cancellationReason: null,
      proposedScheduledAt: null,
      proposedExpiresAt: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: RestoreLessonProps): Lesson {
    return new Lesson({ ...props });
  }
}