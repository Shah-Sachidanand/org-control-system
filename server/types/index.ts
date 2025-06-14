import { Request } from 'express';
import { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organization?: IOrganization;
  permissions: IPermission[];
  isActive: boolean;
  createdBy?: string;
  comparePassword(password: string): Promise<boolean>;
}

export interface IOrganization extends Document {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  features: IOrganizationFeature[];
  settings: {
    maxUsers: number;
    allowedFeatures: string[];
  };
  createdBy: Schema.Types.ObjectId;
  isActive: boolean;
}

export interface IFeature extends Document {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  subFeatures: ISubFeature[];
  requiredRole: UserRole;
  isSystemFeature: boolean;
  status: 'pending' | 'in_progress' | 'done';
}

export interface ISubFeature {
  name: string;
  displayName: string;
  description?: string;
  actions: PermissionAction[];
}

export interface IOrganizationFeature {
  name: string;
  isEnabled: boolean;
  subFeatures: {
    name: string;
    isEnabled: boolean;
  }[];
}

export interface IPermission {
  feature: string;
  subFeatures: string[];
  actions: PermissionAction[];
}

export interface IInvitation extends Document {
  _id: string;
  email: string;
  role: UserRole;
  organizationId: Schema.Types.ObjectId;
  permissions: IPermission[];
  invitedBy: Schema.Types.ObjectId;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  acceptedAt?: Date;
  firstName?: string; // For admin invitations
  lastName?: string;  // For admin invitations
}

export interface IPromotion extends Document {
  _id: string;
  title: string;
  description?: string;
  type: PromotionType;
  status: PromotionStatus;
  startDate: Date;
  endDate: Date;
  targetAudience: {
    ageRange?: {
      min: number;
      max: number;
    };
    location?: string[];
    interests?: string[];
  };
  content: {
    subject?: string;
    body?: string;
    imageUrl?: string;
    videoUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
  };
  settings: {
    maxRedemptions?: number;
    currentRedemptions: number;
    discountType?: 'percentage' | 'fixed' | 'free_shipping';
    discountValue?: number;
    minimumPurchase?: number;
    codes?: string[];
  };
  organizationId: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: string;
}

export interface IMerchandise extends Document {
  _id: string;
  name: string;
  description?: string;
  type: MerchandiseType;
  category: string;
  status: MerchandiseStatus;
  pricing: {
    cost: number;
    currency: string;
    pointsRequired?: number;
  };
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    trackInventory: boolean;
  };
  details: {
    images: string[];
    specifications: {
      key: string;
      value: string;
    }[];
    dimensions?: {
      length: number;
      width: number;
      height: number;
      weight: number;
    };
  };
  redemption: {
    isRedeemable: boolean;
    redemptionInstructions?: string;
    expiryDays?: number;
    maxRedemptionsPerUser?: number;
  };
  organizationId: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: string;
}

export type UserRole = 'USER' | 'ORGADMIN' | 'ADMIN' | 'SUPERADMIN';

export type PermissionAction = 'read' | 'write' | 'delete' | 'manage';

export type PromotionType = 'email' | 'unique_code' | 'qr_code' | 'video' | 'joining_bonus';

export type PromotionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'expired';

export type MerchandiseType = 'experience' | 'loaded_value' | 'autograph' | 'merch_level';

export type MerchandiseStatus = 'active' | 'inactive' | 'out_of_stock' | 'discontinued';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  role?: UserRole;
}

export interface PermissionCheckRequest {
  feature: string;
  subFeature?: string;
  action: PermissionAction;
}

export interface UpdatePermissionsRequest {
  permissions: IPermission[];
}

export interface InviteUserRequest {
  email: string;
  role: UserRole;
  organizationId: string;
  permissions?: IPermission[];
}

export interface CreatePromotionRequest {
  title: string;
  description?: string;
  type: PromotionType;
  startDate: Date;
  endDate: Date;
  targetAudience?: {
    ageRange?: { min: number; max: number };
    location?: string[];
    interests?: string[];
  };
  content?: {
    subject?: string;
    body?: string;
    imageUrl?: string;
    videoUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
  };
  settings?: {
    maxRedemptions?: number;
    discountType?: 'percentage' | 'fixed' | 'free_shipping';
    discountValue?: number;
    minimumPurchase?: number;
    codes?: string[];
  };
}

export interface UpdatePromotionRequest extends Partial<CreatePromotionRequest> {
  status?: PromotionStatus;
}

export interface CreateMerchandiseRequest {
  name: string;
  description?: string;
  type: MerchandiseType;
  category: string;
  pricing: {
    cost: number;
    currency?: string;
    pointsRequired?: number;
  };
  inventory: {
    quantity: number;
    lowStockThreshold?: number;
    trackInventory?: boolean;
  };
  details?: {
    images?: string[];
    specifications?: { key: string; value: string }[];
    dimensions?: {
      length: number;
      width: number;
      height: number;
      weight: number;
    };
  };
  redemption?: {
    isRedeemable?: boolean;
    redemptionInstructions?: string;
    expiryDays?: number;
    maxRedemptionsPerUser?: number;
  };
}

export interface UpdateMerchandiseRequest extends Partial<CreateMerchandiseRequest> {
  status?: MerchandiseStatus;
}