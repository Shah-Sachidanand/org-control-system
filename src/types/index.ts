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
}

export interface Feature {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  subFeatures: SubFeature[];
  requiredRole: UserRole;
  isSystemFeature: boolean;
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

export type UserRole = 'USER' | 'ORGADMIN' | 'ADMIN' | 'SUPERADMIN';

export type PermissionAction = 'read' | 'write' | 'delete' | 'manage';

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