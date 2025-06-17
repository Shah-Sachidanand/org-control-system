import { Request } from "express";
import { Document, Schema } from "mongoose";

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
  createdAt: string;
  updatedAt: string;
  settings?: IUserSettings;
  comparePassword(password: string): Promise<boolean>;
}

export interface IOrganization extends Document {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  features: IOrganizationFeature[];
  settings: IOrganizationSettings;
  createdBy: Schema.Types.ObjectId;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IFeature extends Document {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  subFeatures: ISubFeature[];
  requiredRole: UserRole;
  isSystemFeature: boolean;
  featureLevel: FeatureLevel;
  status: FeatureStatus;
  createdAt: string;
  updatedAt: string;
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
  status: "pending" | "accepted" | "expired";
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
}

export interface IPromotion extends Document {
  _id: string;
  title: string;
  description?: string;
  type: PromotionType;
  status: PromotionStatus;
  startDate: Date;
  endDate: Date;
  partnerId?: string;
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
    discountType?: "percentage" | "fixed" | "free_shipping";
    discountValue?: number;
    minimumPurchase?: number;
    codes?: string[];
  };
  organizationId: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface IPartner extends Document {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
  };
  status: PartnerStatus;
  organizationId: Schema.Types.ObjectId;
  isDefault: boolean;
  sponsorshipDetails: {
    budget?: number;
    currency?: string;
    contractStartDate?: Date;
    contractEndDate?: Date;
    terms?: string;
    paymentStatus?: PaymentStatus;
    paymentIntentId?: string;
    paymentMethod?: string;
    paidAt?: Date;
    paymentAmount?: number;
  };
  createdBy: Schema.Types.ObjectId;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotification extends Document {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  userId: Schema.Types.ObjectId;
  organizationId?: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  metadata: any;
  expiresAt?: Date;
  readAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface IUserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    promotions: boolean;
    invitations: boolean;
    system: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
  };
  preferences: {
    theme: "light" | "dark";
    language: string;
    timezone: string;
  };
}

export interface IOrganizationSettings {
  maxUsers: number;
  allowedFeatures: string[];
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  notifications: {
    enableEmail: boolean;
    enablePush: boolean;
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    sessionTimeout: number;
  };
}

export type UserRole = "USER" | "ORGADMIN" | "ADMIN" | "SUPERADMIN";

export type PermissionAction = "read" | "write" | "delete" | "manage";

export type FeatureLevel = "ORGANIZATION" | "USER_ROLE" | "SYSTEM";

export type PromotionType =
  | "email"
  | "unique_code"
  | "qr_code"
  | "video"
  | "joining_bonus";

export type PromotionStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "expired";

export type MerchandiseType =
  | "experience"
  | "loaded_value"
  | "autograph"
  | "merch_level";

export type MerchandiseStatus =
  | "active"
  | "inactive"
  | "out_of_stock"
  | "discontinued";

export type PartnerStatus = "active" | "inactive" | "pending";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "invitation"
  | "promotion"
  | "system";

export type NotificationStatus = "unread" | "read" | "archived";

export type FeatureStatus = "pending" | "in_progress" | "done";
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

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  permissions?: IPermission[];
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
  partnerId?: string;
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
    discountType?: "percentage" | "fixed" | "free_shipping";
    discountValue?: number;
    minimumPurchase?: number;
    codes?: string[];
  };
}

export interface UpdatePromotionRequest
  extends Partial<CreatePromotionRequest> {
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

export interface UpdateMerchandiseRequest
  extends Partial<CreateMerchandiseRequest> {
  status?: MerchandiseStatus;
}

export interface CreatePartnerRequest {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
  };
  organizationId?: string;
  sponsorshipDetails?: {
    budget?: number;
    currency?: string;
    contractStartDate?: Date;
    contractEndDate?: Date;
    terms?: string;
  };
}

export interface UpdatePartnerRequest extends Partial<CreatePartnerRequest> {
  status?: PartnerStatus;
}

export interface PaymentIntentRequest {
  partnerId: string;
  amount: number;
  currency?: string;
}

export interface PaymentConfirmRequest {
  paymentIntentId: string;
  paymentMethodId: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type?: NotificationType;
  userId: string;
  organizationId?: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  metadata?: any;
  expiresAt?: Date;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
