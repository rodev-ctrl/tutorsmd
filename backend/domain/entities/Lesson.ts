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
  quizId: string | null;
  roomId: string | null;
  cancellationReason: string | null;
  proposedScheduledAt: Date | null  // тьютор предлагает это время
  proposedExpiresAt: Date | null    // до когда клиент должен ответить
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
  quizId?: string | null;
}

interface RestoreLessonProps extends LessonProps {}

// Минимальное окно бронирования — 2 часа до урока
const MIN_BOOKING_HOURS = 2;
// Окно для фиксации no_show — с +15мин до +24ч от scheduledAt
const NO_SHOW_WINDOW_MIN_MINUTES = 15;
const NO_SHOW_WINDOW_MAX_HOURS = 24;

export class Lesson {
  private readonly props: LessonProps;

  private constructor(props: LessonProps) {
    this.props = props;
  }


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
  get quizId(): string | null { return this.props.quizId; }
  get roomId(): string | null { return this.props.roomId; }
  get cancellationReason(): string | null { return this.props.cancellationReason; }
  get startedAt(): Date | null { return this.props.startedAt ? new Date(this.props.startedAt) : null; }
  get completedAt(): Date | null { return this.props.completedAt ? new Date(this.props.completedAt) : null; }
  get createdAt(): Date { return new Date(this.props.createdAt); }
  get updatedAt(): Date { return new Date(this.props.updatedAt); }

  get isTrial(): boolean { return this.props.type === 'trial'; }
  get isRegular(): boolean { return this.props.type === 'regular'; }

  get isConfirmed(): boolean { return this.props.status === 'confirmed'; }
  get isInProgress(): boolean { return this.props.status === 'in_progress'; }
  get isCompleted(): boolean { return this.props.status === 'completed'; }
  get isCancelled(): boolean {
    return this.props.status === 'cancelled_by_client' || this.props.status === 'cancelled_by_tutor';
  }
  get isRescheduled(): boolean { return this.props.status === 'rescheduled'; }
  get isTerminal(): boolean {
    return ['completed', 'cancelled_by_client', 'cancelled_by_tutor', 'rescheduled', 'no_show_client', 'no_show_tutor']
      .includes(this.props.status);
  }



  /*
    Тьютор/клиент нажимает "Начать урок"
    Доступно за 5 минут до scheduledAt
   */
  start(roomId: string): Lesson {
    if (!this.isConfirmed) {
      throw new DomainError('Only confirmed lessons can be started');
    }

    const fiveMinutesBefore = new Date(this.props.scheduledAt.getTime() - 5 * 60 * 1000);
    if (new Date() < fiveMinutesBefore) {
      throw new DomainError('Lesson can only be started 5 minutes before scheduled time');
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

  /**
   * Тьютор нажимает "Завершить урок"
   */
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

  /**
   * Отмена клиентом
   * Недоступно за < 2ч до урока
   */
  cancelByClient(reason?: string): Lesson {
    if (!this.isConfirmed) {
      throw new DomainError('Only confirmed lessons can be cancelled');
    }

    if (this.isWithinCancellationWindow()) {
      throw new DomainError(
        `Cannot cancel less than ${MIN_BOOKING_HOURS} hours before the lesson`
      );
    }

    return new Lesson({
      ...this.props,
      status: 'cancelled_by_client',
      cancellationReason: reason ?? null,
      updatedAt: new Date(),
    });
  }

  /**
   * Отмена тьютором
   */
  cancelByTutor(reason?: string): Lesson {
    if (!this.isConfirmed) {
      throw new DomainError('Only confirmed lessons can be cancelled');
    }

    return new Lesson({
      ...this.props,
      status: 'cancelled_by_tutor',
      cancellationReason: reason ?? null,
      updatedAt: new Date(),
    });
  }

  /**
   * Перенос урока
   * Недоступно за < 2ч до урока
   */
  reschedule(): Lesson {
    if (!this.isConfirmed) {
      throw new DomainError('Only confirmed lessons can be rescheduled');
    }

    if (this.isWithinCancellationWindow()) {
      throw new DomainError(
        `Cannot reschedule less than ${MIN_BOOKING_HOURS} hours before the lesson`
      );
    }

    return new Lesson({
      ...this.props,
      status: 'rescheduled',
      updatedAt: new Date(),
    });
  }

  /**
   * Тьютор фиксирует что студент не пришёл
   * Доступно с +15мин до +24ч от scheduledAt
   */
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
      throw new DomainError('Too early to mark no-show. Wait at least 15 minutes after scheduled time');
    }

    if (now > windowEnd) {
      throw new DomainError('No-show window expired (24 hours after scheduled time)');
    }

    return new Lesson({
      ...this.props,
      status: 'no_show_client',
      updatedAt: new Date(),
    });
  }

  /**
   * Студент фиксирует что тьютор не пришёл
   * Создаётся Appeal — статус lesson не меняется напрямую
   * Этот метод только для admin-разбирательства
   */
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

  /**
   * Автозавершение через cron — если никто не нажал "Завершить"
   */
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

  private isWithinCancellationWindow(): boolean {
    const windowMs = MIN_BOOKING_HOURS * 60 * 60 * 1000;
    return new Date().getTime() > this.props.scheduledAt.getTime() - windowMs;
  }

  canBeCancelledByClient(): boolean {
    return this.isConfirmed && !this.isWithinCancellationWindow();
  }

  canBeRescheduled(): boolean {
    return this.isConfirmed && !this.isWithinCancellationWindow();
  }

  canBeStarted(): boolean {
    if (!this.isConfirmed) return false;
    const fiveMinutesBefore = new Date(this.props.scheduledAt.getTime() - 5 * 60 * 1000);
    return new Date() >= fiveMinutesBefore;
  }



  static create(props: CreateLessonProps): Lesson {
    if (props.clientId === props.tutorId) {
      throw new DomainError('Client and tutor cannot be the same person');
    }

    // Урок должен быть минимум через 2 часа
    const minScheduledAt = new Date(Date.now() + MIN_BOOKING_HOURS * 60 * 60 * 1000);
    if (props.scheduledAt < minScheduledAt) {
      throw new DomainError(
        `Lesson must be scheduled at least ${MIN_BOOKING_HOURS} hours in advance`
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
      status: 'confirmed',
      scheduledAt: props.scheduledAt,
      durationMinutes: props.durationMinutes ?? 60,
      recurringScheduleId: props.recurringScheduleId ?? null,
      rescheduledFromId: props.rescheduledFromId ?? null,
      quizId: props.quizId ?? null,
      roomId: null,
      cancellationReason: null,
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