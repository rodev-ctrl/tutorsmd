import { Request } from "express";


  export interface PasswordChangeBody {
    oldPassword: string;
    newPassword: string;
    role: string
  }

  export interface RefreshCookie {
    refreshToken?: string;
  }

  export interface ForgotPasswordBody {
    email: string;
    language: string;
  }

  export type PasswordChangeRequest = Request<
    {},
    any,
    PasswordChangeBody
  > & { cookies: RefreshCookie };

  export type RefreshRequest = Request<
    {},
    any
  > & { cookies: RefreshCookie };

