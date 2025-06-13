export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organization?: Organization;
  permissions: Permission[];
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  features: OrganizationFeature[];
  settings: {
    maxUsers: number;
    allowedFeatures: string[];
  };
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  subFeatures: SubFeature[];
  requiredRole: UserRole;
  isSystemFeature: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubFeature {
  name: string;
  displayName: string;
  description?: string;
  actions: PermissionAction[];
}

export interface OrganizationFeature {
  name: string;
  isEnabled: boolean;
  subFeatures: {
    name: string;
    isEnabled: boolean;
  }[];
}

export interface Permission {
  feature: string;
  subFeatures: string[];
  actions: PermissionAction[];
}

export interface Invitation {
  _id: string;
  email: string;
  role: UserRole;
  organizationId: string;
  permissions: Permission[];
  invitedBy: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  _id: string;
  title: string;
  description?: string;
  type: PromotionType;
  status: PromotionStatus;
  startDate: string;
  endDate: string;
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
  organizationId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Merchandise {
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
  organizationId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'USER' | 'ORGADMIN' | 'ADMIN' | 'SUPERADMIN';

export type PermissionAction = 'read' | 'write' | 'delete' | 'manage';

export type PromotionType = 'email' | 'unique_code' | 'qr_code' | 'video' | 'joining_bonus';

export type PromotionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'expired';

export type MerchandiseType = 'experience' | 'loaded_value' | 'autograph' | 'merch_level';

export type MerchandiseStatus = 'active' | 'inactive' | 'out_of_stock' | 'discontinued';

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
  permissions: Permission[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  permissions?: Permission[];
}

export interface InviteUserRequest {
  email: string;
  role: UserRole;
  organizationId: string;
  permissions?: Permission[];
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