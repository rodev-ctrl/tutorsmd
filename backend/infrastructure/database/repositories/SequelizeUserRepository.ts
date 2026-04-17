// infrastructure/database/repositories/SequelizeUserRepository.ts

import { IUserRepository } from '../../../domain/repositories/InterfaceUserRepository';
import { User } from '../../../domain/entities/User';
import Client from '../models/clientModel';
import Tutor from '../models/tutorModel';
import { sequelize } from '../db';
import { QueryTypes } from 'sequelize';

export class SequelizeUserRepository implements IUserRepository {
  
  async findById(id: number, role: 'client' | 'tutor'): Promise<User | null> {
    const Model = role === 'client' ? Client : Tutor;
    const record = await Model.findByPk(id);
    
    if (!record) return null;
    
    return this.toDomain(record, role);
  }

  async findByEmail(email: string, role: 'client' | 'tutor'): Promise<User | null> {
    let record;
    if (role === 'client') {
      record = await Client.findOne({ where: { email } });
    } else {
      record = await Tutor.findOne({ where: { email } });
    }
    
    if (!record) return null;
    
    return this.toDomain(record, role);
  }

  async findByActivationLink(link: string): Promise<User | null> {
    const query = `
        SELECT *, 'client' as role FROM clients WHERE "activationLink" = :link
    `;
    const result = await sequelize.query(query, {
        replacements: { link },
        type: QueryTypes.SELECT
    }) as any[];

    if (!result.length) return null;
    return this.toDomain(result[0], result[0].role);
}

  async existsByEmail(email: string): Promise<boolean> {
    const existsUsers = `
        SELECT 1 FROM clients WHERE email = :email 
        UNION ALL 
        SELECT 1 FROM tutors WHERE email = :email
        LIMIT 2
  `;

    const existing = await sequelize.query(existsUsers, {
        replacements: { email },
        type: QueryTypes.SELECT
    });
    return existing.length > 0;
  }

  async create(user: User): Promise<void> {
    const Model = user.role === 'client' ? Client : Tutor;
    
    const record =await Model.create({
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

    user.id = record.id
  }

  async save(user: User): Promise<void> {
    const Model = user.role === 'client' ? Client : Tutor;
    
    await Model.update(
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
    await Model.destroy({ where: { id } });
  }

  private toDomain(record: any, role: 'client' | 'tutor'): User {
    const user = new User(
      record.name,
      record.surname,
      record.email,
      record.password,
      role,
      record.isActivated,
      record.activationLink,
      record.username
    );
    user.id = record.id;
    return user;
  }
}