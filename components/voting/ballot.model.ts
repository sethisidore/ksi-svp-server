import { Document, model, Model, Schema, Types } from "mongoose";

import { PartyType } from "../admin/party.model";

export interface BallotType extends Document {
  _id: Types.ObjectId;
  choice: PartyType;
  voterHash: string;
}

const ballotSchema = new Schema({
  choice: { type: Schema.Types.ObjectId, required: true },
  voterHash: { type: String, unique: true }
});

export const Ballot: Model<BallotType> = model<BallotType>('Ballot', ballotSchema);

/**
 * The ballotbox
 */

export interface BallotBoxType extends Document {
  _id: Types.ObjectId;
  area: string;
  tier: 'FED' | 'SEN' | 'HOR' | 'GOV' | 'HOA' | 'LG';
  votes: Array<BallotType>;
  statusOpen: boolean;
  duration?: Date;
}

const ballotBoxSchema = new Schema<BallotBoxType>({
  area: { type: String, required: true },
  tier: { type: String, required: true },
  votes: [{ type: Schema.Types.ObjectId }],
  statusOpen: { type: Boolean, required: true },
  duration: Date
});

export const BallotBox: Model<BallotBoxType> = model<BallotBoxType>('BallotBox', ballotBoxSchema);
