export interface CreateClientBody {
    name: string;
    surname: string;
    email: string;
    password: string;
  }
  
  export interface ActivateParams {
    activationLink: string;
  }

  
  export interface PasswordChangeBody {
    oldPassword: string;
    newPassword: string;
    role: string
  }
  
  export interface SaveProgressBody {
    week_range: string;
    total_hours: number;
    email: string;
  }
  
  export interface GetProgressBody {
    email: string;
  }
  
  export interface RefreshCookie {
    refreshToken: string;
  }

  export interface GastCookie {
    gastToken: string;
  }
  