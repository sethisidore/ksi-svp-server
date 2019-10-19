import { Router } from "express";

import { asyncHandler } from "../../config";
import { AuthController } from "./auth.controller";

class AuthAPI {
  router: Router;
  handler: AuthController;

  constructor () {
    this.router = Router();
    this.handler = new AuthController();
    this.init();
  }

  init () {
    this.router.post('/login', asyncHandler(this.handler.authenticate));
    this.router.post('/register', asyncHandler(this.handler.register))
    this.router.post('/otp', asyncHandler(this.handler.verifyOTPLogin));
    this.router.post('/resend', asyncHandler(this.handler.resendOTP));
    this.router.get('/logout', asyncHandler(this.handler.logoutUser))
  }
}

export const AuthRouter = new AuthAPI().router;
