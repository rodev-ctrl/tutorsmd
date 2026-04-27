import { IPasswordHasher } from '../../application/ports/IPasswordHasher';

// bcrypt обрезает слишком длинные пароли
// import bcrypt from 'bcrypt';

import argon2 from 'argon2';
export class Argon2PasswordHasher implements IPasswordHasher {
  private readonly pepper: string;

  constructor() {
    const pepper = process.env.PASSWORD_PEPPER;
    if (!pepper) throw new Error('PASSWORD_PEPPER env variable is required');
    this.pepper = pepper;
  }

  async hash(password: string): Promise<string> {
    return await argon2.hash(password + this.pepper, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return await argon2.verify(hash, plain + this.pepper);
  }
}