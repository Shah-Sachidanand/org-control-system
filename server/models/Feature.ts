import mongoose, { Schema } from "mongoose";
import { IFeature, ISubFeature, UserRole } from "../types";

const subFeatureSchema = new Schema<ISubFeature>({
  name: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  description: String,
  actions: [String],
});

const featureSchema = new Schema<IFeature>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: String,
    subFeatures: [subFeatureSchema],
    requiredRole: {
      type: String,
      enum: ["USER", "ORGADMIN", "ADMIN", "SUPERADMIN"] as UserRole[],
      default: "USER",
    },
    isSystemFeature: {
      type: Boolean,
      default: false,
    },
    featureLevel: {
      type: String,
      enum: ["ORGANIZATION", "USER_ROLE", "SYSTEM"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "done"],
      default: "done",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IFeature>("Feature", featureSchema);
