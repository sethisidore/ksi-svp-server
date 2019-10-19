import { Document, Schema, Types, Model, model } from 'mongoose';

export interface PartyType extends Document {
  _id: Types.ObjectId
  initials: string;
  logo: LogoType;
  restrictions?: Array<String>;
};

const partySchema = new Schema<PartyType>({
  initials: { type: String, unique: true, match: /[A-Z]{2,4}/ },
  logo: { type: Schema.Types.ObjectId, required: true },
  restrictions: [{ type: String }]
});

export const Party: Model<PartyType> = model<PartyType>('Party', partySchema);

// Interface for the party logo
export interface LogoType extends Document {
  _id: Types.ObjectId,
  data: Buffer;
  contentType: string;
};

const logoSchema = new Schema<LogoType>({
  data: { type: Buffer, unique: true },
  contentType: { type: String, required: true }
});

export const Logo: Model<LogoType> = model<LogoType>('Logo', logoSchema);
