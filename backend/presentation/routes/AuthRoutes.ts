import Router from "express";
const AuthRouter = Router();

import { AuthController } from "../controllers/authController";
import { requireAuth } from "../middlewares/requireAuth";


AuthRouter.post("/login", AuthController.login);      
AuthRouter.post("/logout", requireAuth, AuthController.logout);
AuthRouter.post("/refresh", AuthController.refresh);
AuthRouter.post("/password/change", requireAuth, AuthController.passwordChange);
AuthRouter.post("/password/forgot", AuthController.forgotPassword);
AuthRouter.post("/password/reset", AuthController.passwordReset);
AuthRouter.post("/email/change", requireAuth, AuthController.emailChange);
AuthRouter.get('/email/change/:changeEmailLink', AuthController.emailIsChanged);