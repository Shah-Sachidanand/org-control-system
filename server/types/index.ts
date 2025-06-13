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

export type UserRole = 'USER' | 'ORGADMIN' | 'ADMIN' | 'SUPERADMIN';

export type PermissionAction = 'read' | 'write' | 'delete' | 'manage';

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