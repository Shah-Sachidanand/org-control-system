import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, UserRole, PermissionAction } from "../types";
import { HttpClient } from "@/lib/axios";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: User) => Promise<void>;
  loading: boolean;
  hasPermission: (
    feature: string,
    action?: PermissionAction,
    subFeature?: string
  ) => boolean;
  hasRole: (role: UserRole) => boolean;
  canManageRole: (targetRole: UserRole) => boolean;
  hasFeatureAccess: (featureName: string, featureLevel?: string) => boolean;
  hasOrganizationFeature: (featureName: string, subFeatureName?: string) => boolean;
  canAccessOrganization: (organizationId: string) => boolean;
  getAccessDeniedReason: (feature: string, action?: PermissionAction, subFeature?: string) => string;
  validateOrganizationFeatureAccess: (featureName: string, subFeatureName?: string) => boolean;
  checkCrossOrganizationAccess: (targetOrgId: string) => boolean;
  refreshUserData: () => Promise<void>;
  validateUserOrganizationMembership: () => boolean;
  checkFeatureEnabledInOrganization: (featureName: string, subFeatureName?: string) => boolean;
  auditAccessAttempt: (resource: string, action: string, success: boolean, reason?: string) => void;
  validateFeatureHierarchy: (feature: string, subFeature?: string) => boolean;
  checkSystemLevelAccess: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const getCurrentUser = async () => {
    try {
      const response = await HttpClient.get(`/auth/me`);
      setUser(response.data.user);
    } catch {
      localStorage.removeItem("token");
      setToken(null);
    }
    setLoading(false);
  };

  const refreshUserData = async () => {
    if (token) {
      await getCurrentUser();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await HttpClient.post(`/auth/login`, {
        email,
        password,
      });
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await HttpClient.post(`/auth/register`, userData);
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(newUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Registration failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // CRITICAL FIX: Enhanced audit logging for access attempts
  const auditAccessAttempt = (resource: string, action: string, success: boolean, reason?: string) => {
    const auditData = {
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      organizationId: user?.organization?._id,
      organizationName: user?.organization?.name,
      resource,
      action,
      success,
      reason,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ipAddress: 'client-side', // Would be populated server-side
    };

    // Log to console for development (in production, send to audit service)
    if (!success) {
      console.warn('🔒 ACCESS DENIED:', auditData);
    } else {
      console.log('✅ ACCESS GRANTED:', auditData);
    }

    // In production, send to audit logging service
    // HttpClient.post('/audit/access-attempt', auditData).catch(() => {});
  };

  // CRITICAL FIX: Enhanced user permission validation with organization feature checks
  const hasPermission = (
    feature: string,
    action: PermissionAction = "read",
    subFeature?: string
  ): boolean => {
    if (!user) {
      auditAccessAttempt(feature, action, false, "No authenticated user");
      return false;
    }

    // SUPERADMIN has all permissions
    if (user.role === "SUPERADMIN") {
      auditAccessAttempt(feature, action, true, "SUPERADMIN access");
      return true;
    }

    // Check if user has the specific permission
    const permission = user.permissions.find((p) => p.feature === feature);

    if (!permission?.actions.includes(action)) {
      auditAccessAttempt(feature, action, false, `User lacks ${action} permission for feature ${feature}`);
      return false;
    }

    if (subFeature) {
      const hasSubFeature = permission.subFeatures.includes(subFeature);
      if (!hasSubFeature) {
        auditAccessAttempt(feature, action, false, `User lacks access to sub-feature ${subFeature} in ${feature}`);
        return false;
      }
    }

    // CRITICAL: Validate organization feature access for non-system features
    if (!checkSystemLevelAccess(feature)) {
      const hasOrgFeature = validateOrganizationFeatureAccess(feature, subFeature);
      if (!hasOrgFeature) {
        auditAccessAttempt(feature, action, false, "Organization feature disabled or not configured");
        return false;
      }
    }

    auditAccessAttempt(feature, action, true, "Permission and organization validation passed");
    return true;
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const canManageRole = (targetRole: UserRole): boolean => {
    if (!user) return false;

    const roleHierarchy: Record<UserRole, UserRole[]> = {
      SUPERADMIN: [UserRole.ADMIN, UserRole.ORGADMIN, UserRole.USER],
      ADMIN: [UserRole.ORGADMIN, UserRole.USER],
      ORGADMIN: [UserRole.USER],
      USER: [],
    };

    return roleHierarchy[user.role]?.includes(targetRole) || false;
  };

  // CRITICAL FIX: Enhanced organization membership validation with detailed logging
  const validateUserOrganizationMembership = (): boolean => {
    if (!user) {
      auditAccessAttempt("organization_membership", "validate", false, "No authenticated user");
      return false;
    }

    // SUPERADMIN and ADMIN don't require organization membership
    if (user.role === "SUPERADMIN" || user.role === "ADMIN") {
      auditAccessAttempt("organization_membership", "validate", true, `${user.role} bypasses organization requirement`);
      return true;
    }

    // ORGADMIN and USER must have organization membership
    if (!user.organization) {
      auditAccessAttempt("organization_membership", "validate", false, `User ${user.email} with role ${user.role} has no organization assigned`);
      return false;
    }

    auditAccessAttempt("organization_membership", "validate", true, `User belongs to organization ${user.organization.name}`);
    return true;
  };

  // CRITICAL FIX: Enhanced organization feature validation with comprehensive checks
  const checkFeatureEnabledInOrganization = (featureName: string, subFeatureName?: string): boolean => {
    if (!user) {
      auditAccessAttempt(featureName, "feature_check", false, "No authenticated user");
      return false;
    }

    // SUPERADMIN bypasses organization feature restrictions
    if (user.role === "SUPERADMIN") {
      auditAccessAttempt(featureName, "feature_check", true, "SUPERADMIN bypasses organization restrictions");
      return true;
    }

    // Users without organization cannot access organization features
    if (!user.organization) {
      auditAccessAttempt(featureName, "feature_check", false, `User ${user.email} has no organization for feature check: ${featureName}`);
      return false;
    }

    const orgFeature = user.organization.features?.find(f => f.name === featureName);
    
    if (!orgFeature) {
      auditAccessAttempt(featureName, "feature_check", false, `Feature ${featureName} not configured for organization ${user.organization.name}`);
      return false;
    }

    if (!orgFeature.isEnabled) {
      auditAccessAttempt(featureName, "feature_check", false, `Feature ${featureName} is disabled for organization ${user.organization.name}`);
      return false;
    }

    if (subFeatureName) {
      const subFeature = orgFeature.subFeatures?.find(sf => sf.name === subFeatureName);
      
      if (!subFeature) {
        auditAccessAttempt(featureName, "feature_check", false, `Sub-feature ${subFeatureName} not configured for organization ${user.organization.name}`);
        return false;
      }

      if (!subFeature.isEnabled) {
        auditAccessAttempt(featureName, "feature_check", false, `Sub-feature ${subFeatureName} is disabled for organization ${user.organization.name}`);
        return false;
      }
    }

    auditAccessAttempt(featureName, "feature_check", true, `Feature ${featureName}${subFeatureName ? `:${subFeatureName}` : ''} enabled for organization ${user.organization.name}`);
    return true;
  };

  // CRITICAL FIX: Comprehensive organization feature access validation
  const validateOrganizationFeatureAccess = (featureName: string, subFeatureName?: string): boolean => {
    if (!user) return false;

    // SUPERADMIN bypasses all restrictions
    if (user.role === "SUPERADMIN") return true;

    // Validate organization membership first
    if (!validateUserOrganizationMembership()) {
      return false;
    }

    // Check if feature is enabled in organization
    return checkFeatureEnabledInOrganization(featureName, subFeatureName);
  };

  // CRITICAL FIX: Enhanced cross-organization access control with comprehensive validation
  const checkCrossOrganizationAccess = (targetOrgId: string): boolean => {
    if (!user) {
      auditAccessAttempt("cross_organization", "access", false, "No authenticated user");
      return false;
    }

    // SUPERADMIN can access any organization
    if (user.role === "SUPERADMIN") {
      auditAccessAttempt("cross_organization", "access", true, `SUPERADMIN ${user.email} accessing organization ${targetOrgId}`);
      return true;
    }

    // ADMIN can access organizations they created (would need additional server-side validation)
    if (user.role === "ADMIN") {
      auditAccessAttempt("cross_organization", "access", true, `ADMIN ${user.email} accessing organization ${targetOrgId} (requires server validation)`);
      // In production, you'd make an API call to verify ownership
      return true;
    }

    // ORGADMIN and USER can only access their own organization
    if (user.organization) {
      const hasAccess = user.organization._id === targetOrgId;
      if (!hasAccess) {
        auditAccessAttempt("cross_organization", "access", false, `User ${user.email} attempted unauthorized access to organization ${targetOrgId}`);
      } else {
        auditAccessAttempt("cross_organization", "access", true, `User ${user.email} accessing own organization ${targetOrgId}`);
      }
      return hasAccess;
    }

    auditAccessAttempt("cross_organization", "access", false, `User ${user.email} with no organization attempted to access organization ${targetOrgId}`);
    return false;
  };

  const canAccessOrganization = (organizationId: string): boolean => {
    return checkCrossOrganizationAccess(organizationId);
  };

  // CRITICAL FIX: Enhanced system-level access validation
  const checkSystemLevelAccess = (feature: string): boolean => {
    const systemFeatures = [
      'system_management',
      'platform_administration',
      'global_settings',
      'audit_logs',
      'system_monitoring'
    ];
    
    return systemFeatures.includes(feature);
  };

  // CRITICAL FIX: Enhanced feature hierarchy validation
  const validateFeatureHierarchy = (feature: string, subFeature?: string): boolean => {
    if (!user) return false;

    // Define feature hierarchy and dependencies
    const featureHierarchy: Record<string, string[]> = {
      'user_management': ['organization_management'],
      'partner_management': ['organization_management'],
      'promotion': ['partner_management'],
      'merchandise': ['organization_management']
    };

    // Check if feature has dependencies
    const dependencies = featureHierarchy[feature];
    if (dependencies) {
      for (const dependency of dependencies) {
        if (!hasPermission(dependency, 'read')) {
          auditAccessAttempt(feature, "hierarchy_check", false, `Missing dependency: ${dependency}`);
          return false;
        }
      }
    }

    return true;
  };

  // CRITICAL FIX: Enhanced feature access with comprehensive validation and audit logging
  const hasFeatureAccess = (
    featureName: string,
    featureLevel?: string
  ): boolean => {
    if (!user) {
      auditAccessAttempt(featureName, "feature_access", false, "No authenticated user");
      return false;
    }

    // SUPERADMIN has access to all features
    if (user.role === "SUPERADMIN") {
      auditAccessAttempt(featureName, "feature_access", true, "SUPERADMIN access");
      return true;
    }

    // Check feature hierarchy
    if (!validateFeatureHierarchy(featureName)) {
      return false;
    }

    // Check based on feature level and user role
    switch (featureLevel) {
      case "SYSTEM": {
        const hasAccess = user.role === "SUPERADMIN";
        auditAccessAttempt(featureName, "feature_access", hasAccess, hasAccess ? "SYSTEM level access granted" : "SYSTEM level access denied");
        return hasAccess;
      }

      case "USER_ROLE": {
        const hasAccess = [UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role);
        auditAccessAttempt(featureName, "feature_access", hasAccess, hasAccess ? "USER_ROLE level access granted" : "USER_ROLE level access denied");
        return hasAccess;
      }

      case "ORGANIZATION": {
        // Check if user has role access AND organization has feature enabled
        const hasRoleAccess = [UserRole.ORGADMIN, UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role);
        if (!hasRoleAccess) {
          auditAccessAttempt(featureName, "feature_access", false, "Insufficient role for ORGANIZATION level feature");
          return false;
        }

        // CRITICAL: Validate organization feature access
        const hasOrgFeature = validateOrganizationFeatureAccess(featureName);
        auditAccessAttempt(featureName, "feature_access", hasOrgFeature, hasOrgFeature ? "ORGANIZATION level access granted" : "Organization feature disabled");
        return hasOrgFeature;
      }

      default: {
        // Check specific permission and organization feature
        const hasUserPermission = hasPermission(featureName);
        const hasOrgFeature = validateOrganizationFeatureAccess(featureName);
        const hasAccess = hasUserPermission && hasOrgFeature;
        
        auditAccessAttempt(featureName, "feature_access", hasAccess, hasAccess ? "Comprehensive access check passed" : "Failed permission or organization check");
        return hasAccess;
      }
    }
  };

  // CRITICAL FIX: Legacy method maintained for backward compatibility
  const hasOrganizationFeature = (featureName: string, subFeatureName?: string): boolean => {
    return checkFeatureEnabledInOrganization(featureName, subFeatureName);
  };

  // CRITICAL FIX: Enhanced access denied reason with specific feedback and actionable guidance
  const getAccessDeniedReason = (feature: string, action: PermissionAction = "read", subFeature?: string): string => {
    if (!user) return "You must be logged in to access this feature.";

    // Check organization membership first
    if (!validateUserOrganizationMembership()) {
      if (user.role === "ORGADMIN" || user.role === "USER") {
        return "You are not assigned to any organization. Contact your administrator to be added to an organization.";
      }
    }

    // Check role requirements
    const roleHierarchy = [UserRole.USER, UserRole.ORGADMIN, UserRole.ADMIN, UserRole.SUPERADMIN];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    
    if (userRoleIndex === -1) {
      return "Invalid user role. Contact your administrator.";
    }

    // Check system-level access
    if (checkSystemLevelAccess(feature)) {
      if (user.role !== "SUPERADMIN") {
        return `The '${feature}' feature requires SUPERADMIN access. Contact your system administrator.`;
      }
    }

    // Check organization feature enablement (for non-SUPERADMIN users)
    if (user.role !== "SUPERADMIN" && user.organization) {
      const orgFeature = user.organization.features?.find(f => f.name === feature);
      
      if (!orgFeature) {
        return `The '${feature}' feature is not configured for your organization. Contact your administrator to enable this feature.`;
      }

      if (!orgFeature.isEnabled) {
        return `The '${feature}' feature is disabled for your organization. Contact your administrator to enable this feature.`;
      }

      if (subFeature) {
        const subFeatureObj = orgFeature.subFeatures?.find(sf => sf.name === subFeature);
        
        if (!subFeatureObj) {
          return `The '${subFeature}' sub-feature is not configured for your organization. Contact your administrator.`;
        }

        if (!subFeatureObj.isEnabled) {
          return `The '${subFeature}' sub-feature is disabled for your organization. Contact your administrator to enable this feature.`;
        }
      }
    }

    // Check user permissions
    if (!hasPermission(feature, action, subFeature)) {
      if (subFeature) {
        return `You don't have ${action} access to '${subFeature}' in '${feature}'. Contact your administrator to request access.`;
      }
      return `You don't have ${action} access to '${feature}'. Contact your administrator to request access.`;
    }

    // Check feature hierarchy
    if (!validateFeatureHierarchy(feature, subFeature)) {
      return `Access to '${feature}' requires additional permissions. Contact your administrator for the required access levels.`;
    }

    return "Access denied for unknown reason. Contact your administrator for assistance.";
  };

  const value = {
    user,
    token,
    login,
    logout,
    register,
    loading,
    hasPermission,
    hasRole,
    canManageRole,
    hasFeatureAccess,
    hasOrganizationFeature,
    canAccessOrganization,
    getAccessDeniedReason,
    validateOrganizationFeatureAccess,
    checkCrossOrganizationAccess,
    refreshUserData,
    validateUserOrganizationMembership,
    checkFeatureEnabledInOrganization,
    auditAccessAttempt,
    validateFeatureHierarchy,
    checkSystemLevelAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};