import { Request, Response } from "express"
import { Party, PartyType, Logo, LogoType } from "./party.model";
import Joi from '@hapi/joi';
import { SignOptions } from "jsonwebtoken";
import passport from "passport";
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

import { AdminType } from "./admin.model";
import { User } from "../auth/user.model";

export class AdminController {

  async adminLogin(req: Request, res: Response) {
    passport.authenticate('local', (err: any, admin: AdminType, info: any) => {
      if (err) {
        return res.status(404).json(err);
      }
      if (!admin) {
        return res.status(401).json({ message: info ? info.message : 'Login Failed' });
      }
      if (admin) {
        const { body } = req;
        const { error, value } = $__AdminSchema.validate(body);
        if (error) {
          return res.status(400).json({ error, value });
        }
        // Login admin into the system
        req.logIn(admin, { session: false }, () => {
          if (err) {
            return res.status(500).json(err);
          }
          // No errors! create, sign and send the token to admin
          const jwtBody = {
            _id: admin._id,
            email: admin.email,
            expires: new Date(Date.now() + 3600 * 1000 * 3)
          }
          const options: SignOptions = {
            algorithm: 'HS256',
            subject: admin.email,
            expiresIn: "3h"
          };
          const token = jwt.sign({ admin: jwtBody }, <jwt.Secret>process.env.SESSION_SECRET, options);

          return res.status(200)
            .cookie('adtk', token, { httpOnly: true, secure: true, expires: new Date(Date.now() + 3600 * 1000 * 3) })
            .json({ message: 'OTP Verification Successful', token });
        });
      }
    })(req, res);
  }

  async adminLogout(req: Request, res: Response) {
    req.logOut();
    req.clearCookie('adtk');
    return res.status(200);
  }

  async scheduleElections(req: Request, res: Response) {
    return res.status(200).json("Welcome to admin area, Currently none is scheduled");
  }

  async addParty(req: Request, res: Response) {
    const { body } = req;
    const { error, value } = $__PartySchema.validate(body);
    if (error) {
      return res.status(400).json({ error, value });
    }
    const encodeImage = fs.readFileSync(req.file.path).toString('base64');
    const newLogo = new Logo({
      data: new Buffer(encodeImage, 'base64'),
      contentType: req.file.mimetype
    });
    await newLogo.save();

    const party = new Party({
      initials: body.initials,
      name: body.name,
      restrictions: body.restrictions,
      logo: newLogo
    });
    await party.save();
    return res.status(200).json({ message: 'Successful', party });
  }

  async removePartyFromAllList(req: Request, res: Response) {
    const { id: initials } = req.params;

    const deletedParty = await Party.findOneAndRemove({ initials }).exec();
    return res.status(200).json(deletedParty);
  }

  async fetchAllParties(req: Request, res: Response) {
    const parties: Array<PartyType> = await Party.find({}).exec();
    parties.map(async (item) => {
      await item.populate('logo').execPopulate();
    });
    return res.status(200).json(parties);
  }

  async fetchParty(req: Request, res: Response) {
    const { id } = req.params;

    const party = await Party.findOne({ initials: id }).exec();
    if (party) {
      await party.populate('logo').execPopulate();
      return res.status(200).json(party);
    }
  }

  async updatePartyInfo(req: Request, res: Response) {
    const { body } = req;
    const { error, value } = $__PartySchema.validate(body);
    if (error) {
      return res.status(400).json(error);
    } else if (value) {
      const updatedParty = await Party.findOneAndUpdate(body, req.body, { new: true }).exec()
      return res.status(200).json({ message: "update successful", updatedParty });
    }
  }

  async getUsers(req: Request, res: Response) {
    const admins = await User.find({}).exec();
    return res.status(200).json(admins);
  }
}

/**
 * schema for validation using joi
 */
const $__PartySchema: Joi.ObjectSchema = Joi.object().keys({
  initials: Joi.string().pattern(/[A-Z]{2,4}/).required(),
  logo: Joi.string().required(),
  restrictions: [Joi.string().optional()]
});

const $__AdminSchema: Joi.ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(/[A-Za-z0-9_#*&%@()!$*]{4,100}/).required(),
});
