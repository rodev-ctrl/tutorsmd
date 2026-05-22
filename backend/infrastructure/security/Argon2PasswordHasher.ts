/* 
 * нужно добиться 100-500ms хеширования 1 пароля. Если слишком быстро -> brute-force переберет быстро. 
                                                  Если слишком медленно:
                                                    1) Auth bottleneck(медленный Auth), 
                                                    2) DoS Amplification(сильная нагрузка на сервере из-за DDoS атак(частые запросы на сервер), которые и так долго обрабатываются)
                                                    3) CPU starvation(deadlock, точнее просто Процесс 2 не может получить ресурсы, потому что Процесс 1 все забрал)
*/

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
      type: argon2.argon2id,   // id: i - independent - Memory Access не зависит от password. Защищено от side=channel атак, но слаб против GPU
                               //     d - data dependent - НАОБОРОТ защищен от GPU, но side-channels утечки.
                               //     id - лучшее из обоих  
      memoryCost: 65536,    // Защита от GPU-атаки. 65МБ RAM должен использовать hash (чем больше, тем лучше, но память то не резиновая)
      timeCost: 3,          // 3 - Количество Итераций(Проходов) по памяти
      parallelism: 1,
    });
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return await argon2.verify(hash, plain + this.pepper);
  }
}