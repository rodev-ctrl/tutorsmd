import { Request, Response } from "express";
import ApiError from "../../domain/errors/apiError";
import { v4 as uuidv4 } from "uuid";

import * as Types from "../../interfaces/InterfaceAuthController";
// import AuthService from "../../infrastructure/service/authService";
// import TokenService from "../../infrastructure/service/tokenService";
import I


type Role = "client" | "tutor";

export class AuthController {

    constructor (
      private readonly loginUseCase: ; 
    ) {}
    async login(req:Request<{}, any, Types.LoginBody>, res:Response) {

        const { email, password, role } = req.body;
        if (!role) throw ApiError.BadRequest("Invalid role");
        if (!email) throw ApiError.BadRequest("Invalid email");
        if (!password) throw ApiError.BadRequest("Invalid password");
      
        const clientData = await this.loginUseCase.execute(
          email,
          password,
          role,
          "",
        );
      
        res.cookie("refreshToken", clientData.refreshToken, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production"
        });
      
        res.clearCookie("gastToken");
      
        return res.status(200).json(clientData);
      }
      
      
      static async logout(req:Request & { cookies: Types.RefreshCookie }, res:Response) {
      
        const { refreshToken } = req.cookies;
        if (!refreshToken) throw ApiError.BadRequest("Invalid logout request");

        const payload = TokenService.validateRefreshToken(refreshToken);
        if (!payload) throw ApiError.Unauthorized("Invalid token");

        await AuthService.logout(refreshToken, payload.role);
      
        res.clearCookie("refreshToken");
      
        return res.status(200).json({ message: "Logged out" });
      }
    
      static async refresh(req:Request<{}, any> & { cookies: Types.RefreshCookie }, res:Response) {
    
        console.log("REFRESH");
        const { refreshToken } = req.cookies;
        if (!refreshToken) throw ApiError.BadRequest("Invalid refresh request");
      
        const data = await AuthService.refresh(refreshToken);
        console.log("SEND BACK REFRESH USER")
      console.log(data);
        return res.status(200).json(data);
      }
    

      static async refreshSoft(
        req: Request<{}, any> & { cookies: Types.RefreshCookie },
        res: Response
      ) {
        try {
          const { refreshToken } = req.cookies;
          if (!refreshToken) throw ApiError.BadRequest("Invalid refresh request");
      
          const data = await AuthService.refreshSoft(refreshToken);
      
          if (!data) {
            throw ApiError.Unauthorized("Invalid Token")
          }
      
          return res.status(200).json(data);
        } catch {
          throw ApiError.Unauthorized("Invalid Token")
        }
      }



      //////// PASWORD ///////////////////////////////////////////////////////////
      static async passwordChange(req:Request<{}, Types.PasswordChange> & { cookies: Types.RefreshCookie }, res:Response) {
        const {oldPassword, newPassword} = req.body;
        const {refreshToken} = req.cookies;
        if (!refreshToken) throw ApiError.BadRequest("Invalid logout request");

        if (!oldPassword || !newPassword) {
          throw ApiError.BadRequest("Old and new password are required");
        }
    
        if (newPassword.length < 8) {
          throw ApiError.BadRequest("Password must be at least 8 characters");
        }
         
         const payload = TokenService.validateRefreshToken(refreshToken);
         if (!payload) throw ApiError.Unauthorized("Invalid token");
         
         await AuthService.passwordChange(refreshToken, oldPassword, newPassword);

         res.clearCookie("refreshToken");
         return res.status(200).json({ message: "Password changed" });
      }

      static async forgotPassword(req: Request<{}, any, Types.ForgotPasswordBody>, res: Response) {

          const {email, language} = req.body;
          if (!email) throw ApiError.BadRequest("Email and role required");
    
          const passwordLink = uuidv4();
    
          await AuthService.forgotPassword(email, passwordLink, language || "english");
    
          return res.status(200).json({ message: "If this email exists, a reset link has been sent" });

      }
    
      static async passwordReset(req: Request, res: Response) {
        const {link, newPassword} = req.body;
    
        if(!link || !newPassword) throw ApiError.BadRequest("Link and Password are required");
    
        const reset = await AuthService.passwordReset(link, newPassword);
    
        if(reset) {
          return res.status(200).json({ 
            message: "Password successfuly reset"
        });
        }
    }

    ///////////////////////////////////////////////////////////////////////////


    static async emailChange(req:Request<{}, Types.EmailChange> & { cookies: Types.RefreshCookie }, res:Response) {
      const {newEmail, password} = req.body;
      const {refreshToken} = req.cookies;
      if (!refreshToken) throw ApiError.BadRequest("Invalid logout request");

      if(!newEmail || !password) throw ApiError.BadRequest("Not Enough Data"); 

      const payload = TokenService.validateRefreshToken(refreshToken);
      if (!payload) throw ApiError.Unauthorized("Invalid token");

        const changeEmailLink = uuidv4();
        const data = await AuthService.emailChange(refreshToken, newEmail, password, changeEmailLink)
        if(data) return res.status(200).json(data);
        throw ApiError.BadRequest("Password not changed");
      
    }
  
    static async emailIsChanged(req: Request, res: Response) {
      const { changeEmailLink } = req.params;
  
      if (!changeEmailLink) throw ApiError.BadRequest("Link missing");
  
     const isChangedEmail = await AuthService.isEmailChanged(changeEmailLink);
  
     if(isChangedEmail) return res.status(200).json({ message: "Email updated" });
     throw ApiError.BadRequest("Email chainging failed");
    }
}


