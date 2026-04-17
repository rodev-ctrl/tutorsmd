import { Email } from '../value-objects/Email';



export type Role = 'client' | 'tutor';

export class User {
    private _email: Email;
    private _hashedPassword: string;
    
    public id?: number;

    constructor(

        public readonly name: string,
        public readonly surname: string,
        email: string,
        hashedPassword: string,
        public readonly role: Role,
        public isActivated: boolean = false,
        public activationLink: string | null = null,
        public username: string = ''
    ) {
        if (name.trim().length < 3) throw new Error('Name too short');
        if (surname.trim().length < 3) throw new Error('Surname too short');

        this._email = new Email(email);
        this._hashedPassword = hashedPassword;
    }

    get email(): string {
        return this._email.value;
    }

    get hashedPassword(): string {
        return this._hashedPassword;
    }

    changeEmail(newEmail: string): void {
        const emailVO = new Email(newEmail);
        if (this._email.equals(emailVO)) {
            throw new Error('Same email');
        }
        this._email = emailVO;
    }

    activate(): void {
        if (this.isActivated) throw new Error('Already activated');
        this.isActivated = true;
        this.activationLink = null;
    }

    static create(
        name: string,
        surname: string,
        email: string,
        hashedPassword: string,
        role: Role,
        activationLink: string,
        username: string
    ): User {
        return new User(
            name,
            surname,
            email,
            hashedPassword,
            role,
            false,
            activationLink,
            username
        );
    }

    setHashedPassword(newHash: string): void {
        this._hashedPassword = newHash;
    }
}