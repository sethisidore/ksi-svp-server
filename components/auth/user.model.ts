import {
  Types, Schema, Document, model,
  PassportLocalDocument, PassportLocalModel,
  PassportLocalOptions, PassportLocalSchema
} from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

export interface UserType extends PassportLocalDocument {
  _id: Types.ObjectId;
  username: string;
  password: string;
  vin: string;
  contact: string;
  publicKey?: string;
  regWard?: string;
};

const userSchema = new Schema({
  vin: { type: String, unique: true },
  contact: { type: String, unique: true },
  publicKey: { type: String },
  regWard: { type: String }
}) as PassportLocalSchema;

const options: PassportLocalOptions = {
  usernameLowerCase: true,
  limitAttempts: true,
  maxAttempts: 5,
  usernameQueryFields: []
};

userSchema.plugin(passportLocalMongoose, options);

interface UserModel<T extends Document> extends PassportLocalModel<T>{}

export const User: UserModel<UserType> = model<UserType>('User', userSchema);
