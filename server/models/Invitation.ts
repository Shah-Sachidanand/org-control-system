import mongoose, { Schema } from 'mongoose';
import { IInvitation, UserRole } from '../types';
import crypto from 'crypto';

const invitationSchema = new Schema<IInvitation>({
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['USER', 'ORGADMIN', 'ADMIN', 'SUPERADMIN'] as UserRole[],
        required: true
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    permissions: [{
        feature: String,
        subFeatures: [String],
        actions: [String]
    }],
    invitedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomBytes(32).toString('hex')
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        required: true
    },
    acceptedAt: Date
}, {
    timestamps: true
});

export default mongoose.model<IInvitation>('Invitation', invitationSchema);