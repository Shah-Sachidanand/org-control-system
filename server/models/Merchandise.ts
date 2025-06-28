import mongoose, { Schema } from 'mongoose';
import { IMerchandise, MerchandiseType, MerchandiseStatus } from '../types';

const merchandiseSchema = new Schema<IMerchandise>({
    name: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['experience', 'loaded_value', 'autograph', 'merch_level'] as MerchandiseType[],
        required: true
    },
    category: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock', 'discontinued'] as MerchandiseStatus[],
        default: 'active'
    },
    pricing: {
        cost: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        },
        pointsRequired: Number
    },
    inventory: {
        quantity: {
            type: Number,
            required: true,
            default: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 10
        },
        trackInventory: {
            type: Boolean,
            default: true
        }
    },
    details: {
        images: [String],
        specifications: [{
            key: String,
            value: String
        }],
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            weight: Number
        }
    },
    redemption: {
        isRedeemable: {
            type: Boolean,
            default: true
        },
        redemptionInstructions: String,
        expiryDays: Number,
        maxRedemptionsPerUser: Number
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

export default mongoose.model<IMerchandise>('Merchandise', merchandiseSchema);