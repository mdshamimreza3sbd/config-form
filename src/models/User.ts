import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): boolean;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to compare password (plain text comparison)
UserSchema.methods.comparePassword = function (
  candidatePassword: string
): boolean {
  console.log("candidatePassword", candidatePassword);
  console.log("this.password", this.password);
  return this.password === candidatePassword;
};

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
