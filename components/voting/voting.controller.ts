import { Request, Response } from 'express';
import Joi from '@hapi/joi';
import crypto from 'crypto';

import { Ballot, BallotType, BallotBox, BallotBoxType } from './ballot.model';
import { PartyType, Party } from '../admin/party.model';
import { User } from '../auth/user.model';


export class VotingController {
  async generateRSAKeys () {
    const publicKey = <string>process.env.PUBLIC_KEY;
    const privateKey = <string>process.env.PRIVATE_KEY;
    return {publicKey, privateKey};
  }

  async castBallot (req: Request, res: Response) {
    const { ballot } = req.body;
    const { error, value } = $__ElectionSchema.validate(ballot);
    if (error) {
    return res.status(400).json({ value, error });
    } else if (value) {
      const newBallot = new Ballot(ballot);
      await newBallot.save();
      return res.status(201).json({ newBallot })
    }
  }

  async prepareBallot (req: Request, res: Response) {
    const { publicKey, user } = req.params;

    const parties: PartyType[] = await Party.find({}).exec();
    const keys = await this.generateRSAKeys();
    const aesKey = crypto.randomBytes(32);
    const aesIV = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-192-gcm', aesKey, aesIV);
    //let encrypted = cipher.update()

    return res.status(200).json({ parties, key: keys.publicKey });
  }

  async verifyAndRecordBallot (req: Request, res: Response) {
    /**
     * ensure ballot was not tampered with.
     */
    const { body } = req;
    const { error, value } = $__ElectionSchema.validate(body);
    if (error) { return res.status(400).json({ error, value }); }
    // Hash user VIN
    const user = await User.findByUsername(req.params.username, false).exec();
    const userHash = crypto.createHash(user.vin);
    const userChoice = await Party.findOne({ choice: body.choice }).exec();
    if (!userChoice) return res.status(404).json({ message: 'Party choice not found'});

    const ballot = new Ballot({
      choice: userChoice._id,
      voterHash: userHash
    });
    await ballot.save();

    const election = await BallotBox.findOne({ area: body.area, tier: body.tier }).exec();
    if (election) {
      election.votes.push(ballot);
      return res.json({ message: 'Welcome to Ballot Verification'});
    }
  }

  async availableElections (req: Request, res: Response) {
    const elections = await BallotBox.find({ statusOpen: true }).exec();
    return res.json({ elections });
  }
}

/**
 * Joi schemas to validate incoming ballot/votes
 **/

const $__ElectionSchema: Joi.ObjectSchema = Joi.object().keys({
  tier: Joi.string().pattern(/FED|SEN|HOR|GOV|HOA|LG/).required(),
  choice: Joi.string().required()
});