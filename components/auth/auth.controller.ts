import { Request, Response } from "express";
import { totp } from 'otplib';
import crypto from 'crypto';
import twilio from 'twilio';
import Joi from '@hapi/joi';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from "jsonwebtoken";
import passport from "passport";

import { User, UserType } from "./user.model";

export class AuthController {

  async authenticate(req: Request, res: Response) {
    const { body } = req;
    const { error, value } = $__LoginSchema.validate(body);
    if (error) {
      return res.status(400).json({ value, error });
    }
    const { username, password } = body;
    const user = await User.findByUsername(username, false).exec();
    const auth = await user.authenticate(password);
    if (auth.user) {
      await this.sendOTP(user.contact);
      return res.status(206).json({
        message: `Welcome! Authentication Partially Successful!!!\n
          A one-time-password has been sent to your mobile contact.`
      });
    }
    return res.status(401).json({ message: 'Authentication Failed!!! Incorrect credentials provided' });
  }

  async register(req: Request, res: Response) {
    const { body } = req;
    const { error, value } = $__UserSchema.validate(body);
    if (error) {
      return res.status(400).json({ error, value });
    }
    const { password, ...payload } = body;
    const user = new User(payload);
    await user.setPassword(password);
    await user.save();
    await this.sendOTP(user.contact);
    return res.status(206).json({ message: 'Registration Successful!!\n Please enter the otp sent to your contact' });
  }

  async logoutUser(req: Request, res: Response) {
    req.logOut();
    req.clearCookie('auth-token');
    return res.status(200).clearCookie('auth-token');
  }

  async resendOTP(req: Request, res: Response) {
    const { contact } = req.body;

    await this.sendOTP(contact);
    return res.status(200).json({ message: `OTP has been resent` });
  }

  async sendOTP(contact: string) {
    // generate and otp to mobile number
    totp.options = { crypto: crypto, digits: 8 };
    const secret = <string>process.env.SESSION_SECRET;
    const token = totp.generate(secret);

    // send otp to mobile number
    const twilioSID = process.env.TWILIO_SID;
    const twilioToken = process.env.TWILIO_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM

    const messagingClient = twilio(twilioSID, twilioToken);
    return await messagingClient.messages.create({
      body: `Your one-time-password is: ${token}`,
      from: twilioFrom,
      to: contact
    });
  }

  async verifyOTPLogin(req: Request, res: Response) {
    passport.authenticate('local', (err: any, user: UserType, info: any) => {
      if (err) {
        return res.status(404).json(err);
      }
      if (!user) {
        return res.status(401).json({ message: info ? info.message : 'Login Failed' });
      }
      if (user) {
        const { body } = req;
        const { error, value } = $__LoginSchema.validate(body);
        if (error) {
          return res.status(400).json({ error, value });
        }
        // No Errors? then verify the OTP received
        const secret = <string>process.env.SESSION_SECRET;
        const isValidOTP = totp.verify({ secret, token: body.otp });

        if (isValidOTP) {
          // Login user into the system
          req.logIn(user, { session: false }, () => {
            if (err) {
              return res.status(500).json(err);
            }
            // No errors! create, sign and send the token to user
            const jwtBody = {
              _id: user._id,
              username: user.username,
              regWard: user.regWard,
              expires: new Date(Date.now() + 3600 * 1000 * 3)
            }
            const options: SignOptions = {
              algorithm: 'HS256',
              subject: jwtBody.username,
              expiresIn: "3h"
            };
            const token = jwt.sign({ user: jwtBody }, <jwt.Secret>process.env.SESSION_SECRET, options);

            return res.status(200)
              .cookie('auth-token', token, { httpOnly: true, secure: true, expires: new Date(Date.now() + 3600 * 1000 * 3) })
              .json({ message: 'OTP Verification Successful', token });
          });
        } else {
          return res.status(400).json({ message: 'Wrong Code entered' });
        }
      }
    })(req, res);
  }
}

/**
 * schemas for validation using joi
 **/
const $__LoginSchema: Joi.ObjectSchema = Joi.object().keys({
  username: Joi.string().pattern(/[A-Za-z][A-za-Z0-9_]{2,50}/).required(),
  password: Joi.string().pattern(/[a-ZA-z0-9_#*&%@()!$*]{4,100}/).required(),
  otp: Joi.string().pattern(/[0-9]{8}/).optional()
});

const $__UserSchema: Joi.ObjectSchema = Joi.object().keys({
  password: Joi.string().pattern(/[a-ZA-z0-9_#*&%@()!$*]{4,100}/).required(),
  confirmPassword: Joi.ref('password'),
  vin: Joi.string().pattern(/[A-Z0-9]{8}[0-9]{12}/).required(),
  email: Joi.string().email().required(),
  contact: Joi.string().pattern(/\+234(([7-9]0)|81)([1-7]|9)[0-9]{7}/).required()
});
