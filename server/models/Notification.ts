import mongoose, { Schema } from 'mongoose';
import { INotification, NotificationType, NotificationStatus } from '../types';

const notificationSchema = new Schema<INotification>({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'invitation', 'promotion', 'system'] as NotificationType[],
        default: 'info'
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'archived'] as NotificationStatus[],
        default: 'unread'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization'
    },
    relatedId: String, // ID of related entity (promotion, invitation, etc.)
    relatedType: String, // Type of related entity
    actionUrl: String,
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    expiresAt: Date,
    readAt: Date
}, {
    timestamps: true
});

export default mongoose.model<INotification>('Notification', notificationSchema);