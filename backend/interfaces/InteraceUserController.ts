export interface ForgotPasswordBody {
    email: string;
    role: string
    language: string;
  }

  export interface RefreshCookie {
    refreshToken: string;
  }

  export interface LoginBody {
    email: string;
    password: string;
  }