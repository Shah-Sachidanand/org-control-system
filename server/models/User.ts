import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, IPermission } from '../types';

const permissionSchema = new Schema<IPermission>({
  feature: {
    type: String,
    required: true
  },
  subFeatures: [String],
  actions: [String]
});

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['USER', 'ORGADMIN', 'ADMIN', 'SUPERADMIN'] as UserRole[],
    default: 'USER'
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: function (this: IUser) {
      return this.role !== 'SUPERADMIN';
    }
  },
  permissions: [permissionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', userSchema);