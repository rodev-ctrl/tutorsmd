export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashedPassword: string): Promise<boolean>;
}