import { Role } from '../../../domain/entities/User';

export interface LoginDto {
  email: string;
  password: string;
  activeRole: Role;
  deviceInfo?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    surname: string;
    activeRole: Role;
  };
}