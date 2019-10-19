import {
  Types, Schema, Document, model,
  PassportLocalDocument, PassportLocalModel,
  PassportLocalOptions, PassportLocalSchema
} from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

export interface AdminType extends PassportLocalDocument {
  _id: Types.ObjectId;
  email: string;
  password: string;
};

const adminSchema = new Schema({
  email: { type: String, unique: true }
}) as PassportLocalSchema;

const options: PassportLocalOptions = {
  usernameField: 'email',
  usernameUnique: true,
  usernameLowerCase: true,
  limitAttempts: true,
  maxAttempts: 5,
  usernameQueryFields: []
};

adminSchema.plugin(passportLocalMongoose, options);

interface AdminModel<T extends Document> extends PassportLocalModel<T>{}

export const Admin: AdminModel<AdminType> = model<AdminType>('Admin', adminSchema);
