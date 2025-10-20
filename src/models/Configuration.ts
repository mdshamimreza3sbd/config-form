import mongoose, { Document, Schema } from "mongoose";

export interface IConfiguration extends Document {
  userId: string;
  username: string;
  restaurantName: string;
  outletName: string;
  saPassword: string;
  nonSaUsername: string;
  nonSaPassword: string;
  anydeskUsername?: string;
  anydeskPassword?: string;
  ultraviewerUsername?: string;
  ultraviewerPassword?: string;
  saPassChange: boolean;
  syncedUserPassChange: boolean;
  nonSaPassChange: boolean;
  windowsAuthDisable: boolean;
  sqlCustomPort: boolean;
  firewallOnAllPcs: boolean;
  anydeskUninstall: boolean;
  ultraviewerPassAndId: boolean;
  posAdminPassChange: boolean;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConfigurationSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    restaurantName: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    outletName: {
      type: String,
      required: [true, "Outlet name is required"],
      trim: true,
    },
    saPassword: {
      type: String,
      required: [true, "SA password is required"],
    },
    nonSaUsername: {
      type: String,
      required: [true, "Non-SA username is required"],
      trim: true,
    },
    nonSaPassword: {
      type: String,
      required: [true, "Non-SA password is required"],
    },
    anydeskUsername: {
      type: String,
      trim: true,
    },
    anydeskPassword: {
      type: String,
    },
    ultraviewerUsername: {
      type: String,
      trim: true,
    },
    ultraviewerPassword: {
      type: String,
    },
    saPassChange: {
      type: Boolean,
      default: false,
    },
    syncedUserPassChange: {
      type: Boolean,
      default: false,
    },
    nonSaPassChange: {
      type: Boolean,
      default: false,
    },
    windowsAuthDisable: {
      type: Boolean,
      default: false,
    },
    sqlCustomPort: {
      type: Boolean,
      default: false,
    },
    firewallOnAllPcs: {
      type: Boolean,
      default: false,
    },
    anydeskUninstall: {
      type: Boolean,
      default: false,
    },
    ultraviewerPassAndId: {
      type: Boolean,
      default: false,
    },
    posAdminPassChange: {
      type: Boolean,
      default: false,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ConfigurationSchema.index({ userId: 1, createdAt: -1 });
ConfigurationSchema.index({ restaurantName: 1, outletName: 1 });

export default mongoose.models.Configuration ||
  mongoose.model<IConfiguration>("Configuration", ConfigurationSchema);
