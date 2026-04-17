import { IPasswordHasher } from '../../application/ports/IPasswordHasher';
import bcrypt from 'bcrypt';

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> { 
    return bcrypt.hash(plain, 10);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plain, hash);
  }
}