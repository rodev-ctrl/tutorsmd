export interface LoginBody {
    email: string, 
    password: string, 
    role: string
}

export interface PasswordChange {
    newPassword: string;
}

export interface RefreshCookie {
    refreshToken: string
}

export interface ForgotPasswordBody {
    email: string;
    role: string;
    language?: string;
}

export interface EmailChange {
    newEmail: string;
}