import mongoose, { Schema } from 'mongoose';
import { IOrganization, IOrganizationFeature } from '../types/index.js';

const organizationFeatureSchema = new Schema<IOrganizationFeature>({
  name: {
    type: String,
    required: true
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  subFeatures: [{
    name: String,
    isEnabled: {
      type: Boolean,
      default: false
    }
  }]
});

const organizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  features: [organizationFeatureSchema],
  settings: {
    maxUsers: {
      type: Number,
      default: 100
    },
    allowedFeatures: [String]
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IOrganization>('Organization', organizationSchema);