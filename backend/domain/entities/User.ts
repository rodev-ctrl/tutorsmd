import { DomainError } from '../errors/DomainError';
import { Email } from '../value-objects/Email';
import { UserId } from '../value-objects/UserId';

export type Role = 'client' | 'tutor' | 'admin';
export type AuthProvider = 'local' | 'google' | 'github';

interface UserProps {
  id: UserId;
  name: string;
  surname: string;
  username: string;
  email: Email;
  hashedPassword: string | null;
  roles: ReadonlyArray<Role>;
  isEmailVerified: boolean;
  authProvider: AuthProvider;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserProps {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  hashedPassword: string | null;
  authProvider: AuthProvider;
  roles: Role[];
  timezone?: string;
}

interface RestoreUserProps {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  hashedPassword: string | null;
  roles: Role[];
  isEmailVerified: boolean;
  authProvider: AuthProvider;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly props: UserProps;

  private constructor(props: UserProps) {
    this.props = props;
  }

  // --- Getters ---

  get id(): string { return this.props.id.value; }
  get name(): string { return this.props.name; }
  get surname(): string { return this.props.surname; }
  get username(): string { return this.props.username; }
  get email(): string { return this.props.email.value; }
  get hashedPassword(): string | null { return this.props.hashedPassword; }
  get roles(): ReadonlyArray<Role> { return this.props.roles; }
  get isEmailVerified(): boolean { return this.props.isEmailVerified; }
  get authProvider(): AuthProvider { return this.props.authProvider; }
  get timezone(): string { return this.props.timezone; }
  get createdAt(): Date { return new Date(this.props.createdAt); }
  get updatedAt(): Date { return new Date(this.props.updatedAt); }
  get fullName(): string { return `${this.props.name} ${this.props.surname}`; }

  // --- Business methods ---

  updateName(name: string, surname: string): User {
    return new User({
      ...this.props,
      name: User.validateName(name),
      surname: User.validateSurname(surname),
      updatedAt: new Date(),
    });
  }

  changeUsername(username: string): User {
    return new User({
      ...this.props,
      username: User.validateUsername(username),
      updatedAt: new Date(),
    });
  }

  changeEmail(newEmail: string): User {
    const emailVO = Email.create(newEmail);
    if (this.props.email.equals(emailVO)) {
      throw new DomainError('New email is the same as current');
    }
    return new User({
      ...this.props,
      email: emailVO,
      isEmailVerified: false, // сбрасывается при смене email
      updatedAt: new Date(),
    });
  }

  verifyEmail(): User {
    if (this.props.isEmailVerified) {
      throw new DomainError('Email already verified');
    }
    return new User({
      ...this.props,
      isEmailVerified: true,
      updatedAt: new Date(),
    });
  }

  setHashedPassword(newHash: string): User {
    if (!newHash || newHash.trim().length === 0) {
      throw new DomainError('Hashed password cannot be empty');
    }
    if (this.isOAuthUser()) {
      throw new DomainError('Cannot set password for OAuth user');
    }
    return new User({
      ...this.props,
      hashedPassword: newHash,
      updatedAt: new Date(),
    });
  }

  changeTimezone(timezone: string): User {
    return new User({
      ...this.props,
      timezone: User.validateTimezone(timezone),
      updatedAt: new Date(),
    });
  }

  addRole(role: Role): User {
    if (this.hasRole(role)) {
      throw new DomainError(`User already has role: ${role}`);
    }
    return new User({
      ...this.props,
      roles: Object.freeze([...this.props.roles, role]),
      updatedAt: new Date(),
    });
  }

  removeRole(role: Role): User {
    if (!this.hasRole(role)) {
      throw new DomainError(`User does not have role: ${role}`);
    }
    const remaining = this.props.roles.filter(r => r !== role);
    if (remaining.length === 0) {
      throw new DomainError('User must have at least one role');
    }
    return new User({
      ...this.props,
      roles: Object.freeze(remaining),
      updatedAt: new Date(),
    });
  }

  hasRole(role: Role): boolean {
    return this.props.roles.includes(role);
  }

  isOAuthUser(): boolean {
    return this.props.authProvider !== 'local';
  }

  isLocalUser(): boolean {
    return this.props.authProvider === 'local';
  }

  // --- Validators ---

  private static validateName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new DomainError('Name too short');
    if (trimmed.length > 100) throw new DomainError('Name too long');
    return trimmed;
  }

  private static validateSurname(surname: string): string {
    const trimmed = surname.trim();
    if (trimmed.length < 2) throw new DomainError('Surname too short');
    if (trimmed.length > 100) throw new DomainError('Surname too long');
    return trimmed;
  }

  private static validateUsername(username: string): string {
    const trimmed = username.trim();
    if (trimmed.length < 3) throw new DomainError('Username too short');
    if (trimmed.length > 30) throw new DomainError('Username too long');
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      throw new DomainError('Username can only contain letters, numbers and underscores');
    }
    return trimmed;
  }

  private static validateTimezone(timezone: string): string {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return timezone;
    } catch {
      throw new DomainError(`Invalid timezone: ${timezone}`);
    }
  }

  private static validateRoles(roles: Role[]): ReadonlyArray<Role> {
    if (!roles || roles.length === 0) {
      throw new DomainError('User must have at least one role');
    }
    return Object.freeze([...new Set(roles)]);
  }

  private static validateAuthProvider(
    authProvider: AuthProvider,
    hashedPassword: string | null,
  ): void {
    if (authProvider === 'local' && !hashedPassword) {
      throw new DomainError('Local user must have a password');
    }
    if (authProvider !== 'local' && hashedPassword) {
      throw new DomainError('OAuth user must not have a password');
    }
  }

  // --- Factory methods ---

  static create(props: CreateUserProps): User {
    User.validateAuthProvider(props.authProvider, props.hashedPassword);
    const now = new Date();
    return new User({
      id: new UserId(props.id),
      name: User.validateName(props.name),
      surname: User.validateSurname(props.surname),
      username: User.validateUsername(props.username),
      email: Email.create(props.email),
      hashedPassword: props.hashedPassword,
      roles: User.validateRoles(props.roles),
      isEmailVerified: false,
      authProvider: props.authProvider,
      timezone: User.validateTimezone(props.timezone ?? 'UTC'),
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: RestoreUserProps): User {
    
    return new User({
      id: new UserId(props.id),
      name: props.name,
      surname: props.surname,
      username: props.username,
      email: Email.fromPersistence(props.email),
      hashedPassword: props.hashedPassword,
      roles: Object.freeze([...props.roles]),
      isEmailVerified: props.isEmailVerified,
      authProvider: props.authProvider,
      timezone: props.timezone,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }
}