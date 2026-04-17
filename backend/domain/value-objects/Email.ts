export class Email {
    private readonly _email: string;
    constructor(email: string) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Invalid email');
        }
        this._email = email.toLowerCase().trim();
    }

     get value(): string {
        return this._email;
     }

     equals(other: Email): boolean {
        return this._email === other._email;
     }
}