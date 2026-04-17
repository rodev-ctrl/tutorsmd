// infrastructure/database/repositories/SequelizeUserRepository.ts

import { IUserRepository } from '../domain/repositories/InterfaceUserRepository';
import { User } from '../domain/entities/User';
import Client from './database/models/clientModel';
import Tutor from './database/models/tutorModel';

export class SequelizeUserRepository implements IUserRepository {
  
  async findById(id: number, role: 'client' | 'tutor'): Promise<User | null> {
    const Model = role === 'client' ? Client : Tutor;
    const record = await (Model as any).findByPk(id);
    
    if (!record) return null;
    
    return this.toDomain(record, role);
  }

  async findByEmail(email: string, role: 'client' | 'tutor'): Promise<User | null> {
    const Model = role === 'client' ? Client : Tutor;
    const record = await (Model as any).findOne({ where: { email } });
    
    if (!record) return null;
    
    return this.toDomain(record, role);
  }

  async findByActivationLink(link: string): Promise<User | null> {
    // Ищем в обеих таблицах
    let record = await Client.findOne({ where: { activationLink: link } });
    if (record) return this.toDomain(record, 'client');
    
    return null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const clientCount = await Client.count({ where: { email } });
    const tutorCount = await Tutor.count({ where: { email } });
    
    return clientCount > 0 || tutorCount > 0;
  }

  async create(user: User): Promise<void> {
    const Model = user.role === 'client' ? Client : Tutor;
    
    await (Model as any).create({
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      password: user.hashedPassword,
      isActivated: user.isActivated,
      activationLink: user.activationLink,
      username: user.username,
      newEmail: '',
      changeEmailLink: '',
      messages: [],
      progress: []
    });
  }

  async save(user: User): Promise<void> {
    const Model = user.role === 'client' ? Client : Tutor;
    
    await (Model as any).update(
      {
        email: user.email,
        password: user.hashedPassword,
        isActivated: user.isActivated,
        activationLink: user.activationLink,
        username: user.username
      },
      { where: { id: user.id } }
    );
  }

  async delete(id: number, role: 'client' | 'tutor'): Promise<void> {
    const Model = role === 'client' ? Client : Tutor;
    await (Model as any).destroy({ where: { id } });
  }

  async getNextId(): Promise<number> {
    const maxClient = (await Client.max('id') as number) || 0;
    const maxTutor = (await Tutor.max('id') as number) || 0;
    return Math.max(maxClient, maxTutor) + 1;
  }


  private toDomain(record: any, role: 'client' | 'tutor'): User {
    const user = new User(
      record.email,
      record.password,  // уже хеш
      record.name,
      record.surname,
      role,
      record.isActivated,
      record.activationLink,
      record.username
    );
    user.id = record.id;
    return user;
  }
}