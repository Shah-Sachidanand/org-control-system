import mongoose, { Schema } from "mongoose";
import { IPartner, PartnerStatus } from "../types";

const partnerSchema = new Schema<IPartner>(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    logo: String,
    website: String,
    contactInfo: {
      email: String,
      phone: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"] as PartnerStatus[],
      default: "active",
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    sponsorshipDetails: {
      budget: Number,
      currency: {
        type: String,
        default: "USD",
      },
      contractStartDate: Date,
      contractEndDate: Date,
      terms: String,
      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      paymentIntentId: String, // Stripe Payment Intent ID
      paymentMethod: String,
      paidAt: Date,
      paymentAmount: Number,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPartner>("Partner", partnerSchema);
