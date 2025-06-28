import mongoose, { Schema } from 'mongoose';
import { IPromotion, PromotionType, PromotionStatus } from '../types';

const promotionSchema = new Schema<IPromotion>({
    title: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['email', 'unique_code', 'qr_code', 'video', 'joining_bonus'] as PromotionType[],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'completed', 'expired'] as PromotionStatus[],
        default: 'draft'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    targetAudience: {
        ageRange: {
            min: Number,
            max: Number
        },
        location: [String],
        interests: [String]
    },
    content: {
        subject: String,
        body: String,
        imageUrl: String,
        videoUrl: String,
        ctaText: String,
        ctaUrl: String
    },
    settings: {
        maxRedemptions: Number,
        currentRedemptions: {
            type: Number,
            default: 0
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed', 'free_shipping']
        },
        discountValue: Number,
        minimumPurchase: Number,
        codes: [String]
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

export default mongoose.model<IPromotion>('Promotion', promotionSchema);