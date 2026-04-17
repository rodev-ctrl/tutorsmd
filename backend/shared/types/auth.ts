export interface AuthUser {
    id: number;
    role: 'client' | 'tutor' | 'admin';
    email?: string;
  }
  