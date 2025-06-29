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

  // CRITICAL FIX: Enhanced user permission validation
  const hasPermission = (
    feature: string,
    action: PermissionAction = "read",
    subFeature?: string
  ): boolean => {
    if (!user) {
      console.warn("Permission check failed: No authenticated user");
      return false;
    }

    // SUPERADMIN has all permissions
    if (user.role === "SUPERADMIN") return true;

    // Check if user has the specific permission
    const permission = user.permissions.find((p) => p.feature === feature);

    if (!permission?.actions.includes(action)) {
      console.warn(`User ${user.email} lacks ${action} permission for feature ${feature}`);
      return false;
    }

    if (subFeature) {
      const hasSubFeature = permission.subFeatures.includes(subFeature);
      if (!hasSubFeature) {
        console.warn(`User ${user.email} lacks access to sub-feature ${subFeature} in ${feature}`);
      }
      return hasSubFeature;
    }

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

  // CRITICAL FIX: Enhanced organization membership validation
  const validateUserOrganizationMembership = (): boolean => {
    if (!user) {
      console.warn("Organization membership check failed: No authenticated user");
      return false;
    }

    // SUPERADMIN and ADMIN don't require organization membership
    if (user.role === "SUPERADMIN" || user.role === "ADMIN") {
      return true;
    }

    // ORGADMIN and USER must have organization membership
    if (!user.organization) {
      console.warn(`User ${user.email} with role ${user.role} has no organization assigned`);
      return false;
    }

    return true;
  };

  // CRITICAL FIX: Enhanced organization feature validation with real-time checks
  const checkFeatureEnabledInOrganization = (featureName: string, subFeatureName?: string): boolean => {
    if (!user) {
      console.warn("Feature check failed: No authenticated user");
      return false;
    }

    // SUPERADMIN bypasses organization feature restrictions
    if (user.role === "SUPERADMIN") return true;

    // Users without organization cannot access organization features
    if (!user.organization) {
      console.warn(`User ${user.email} has no organization for feature check: ${featureName}`);
      return false;
    }

    const orgFeature = user.organization.features?.find(f => f.name === featureName);
    
    if (!orgFeature) {
      console.warn(`Feature ${featureName} not configured for organization ${user.organization.name}`);
      return false;
    }

    if (!orgFeature.isEnabled) {
      console.warn(`Feature ${featureName} is disabled for organization ${user.organization.name}`);
      return false;
    }

    if (subFeatureName) {
      const subFeature = orgFeature.subFeatures?.find(sf => sf.name === subFeatureName);
      
      if (!subFeature) {
        console.warn(`Sub-feature ${subFeatureName} not configured for organization ${user.organization.name}`);
        return false;
      }

      if (!subFeature.isEnabled) {
        console.warn(`Sub-feature ${subFeatureName} is disabled for organization ${user.organization.name}`);
        return false;
      }
    }

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

  // CRITICAL FIX: Enhanced cross-organization access control with audit logging
  const checkCrossOrganizationAccess = (targetOrgId: string): boolean => {
    if (!user) {
      console.warn("Cross-organization access check failed: No authenticated user");
      return false;
    }

    // SUPERADMIN can access any organization
    if (user.role === "SUPERADMIN") {
      console.log(`AUDIT: SUPERADMIN ${user.email} accessing organization ${targetOrgId}`);
      return true;
    }

    // ADMIN can access organizations they created (would need additional validation in production)
    if (user.role === "ADMIN") {
      console.log(`AUDIT: ADMIN ${user.email} accessing organization ${targetOrgId}`);
      // In production, you'd check if they created the organization
      return true;
    }

    // ORGADMIN and USER can only access their own organization
    if (user.organization) {
      const hasAccess = user.organization._id === targetOrgId;
      if (!hasAccess) {
        console.warn(`SECURITY: User ${user.email} attempted unauthorized access to organization ${targetOrgId}`);
      }
      return hasAccess;
    }

    console.warn(`SECURITY: User ${user.email} with no organization attempted to access organization ${targetOrgId}`);
    return false;
  };

  const canAccessOrganization = (organizationId: string): boolean => {
    return checkCrossOrganizationAccess(organizationId);
  };

  // CRITICAL FIX: Enhanced feature access with comprehensive validation and audit logging
  const hasFeatureAccess = (
    featureName: string,
    featureLevel?: string
  ): boolean => {
    if (!user) {
      console.warn("Feature access check failed: No authenticated user");
      return false;
    }

    // SUPERADMIN has access to all features
    if (user.role === "SUPERADMIN") return true;

    // Check based on feature level and user role
    switch (featureLevel) {
      case "SYSTEM": {
        const hasAccess = user.role === "SUPERADMIN";
        if (!hasAccess) {
          console.warn(`User ${user.email} attempted to access SYSTEM level feature ${featureName}`);
        }
        return hasAccess;
      }

      case "USER_ROLE": {
        const hasAccess = [UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role);
        if (!hasAccess) {
          console.warn(`User ${user.email} attempted to access USER_ROLE level feature ${featureName}`);
        }
        return hasAccess;
      }

      case "ORGANIZATION": {
        // Check if user has role access AND organization has feature enabled
        const hasRoleAccess = [UserRole.ORGADMIN, UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role);
        if (!hasRoleAccess) {
          console.warn(`User ${user.email} lacks role access for ORGANIZATION level feature ${featureName}`);
          return false;
        }

        // CRITICAL: Validate organization feature access
        const hasOrgFeature = validateOrganizationFeatureAccess(featureName);
        if (!hasOrgFeature) {
          console.warn(`User ${user.email} organization lacks feature ${featureName}`);
        }
        return hasOrgFeature;
      }

      default: {
        // Check specific permission and organization feature
        const hasUserPermission = hasPermission(featureName);
        const hasOrgFeature = validateOrganizationFeatureAccess(featureName);
        const hasAccess = hasUserPermission && hasOrgFeature;
        
        if (!hasAccess) {
          console.warn(`User ${user.email} failed comprehensive access check for feature ${featureName}`);
        }
        return hasAccess;
      }
    }
  };

  // CRITICAL FIX: Legacy method maintained for backward compatibility
  const hasOrganizationFeature = (featureName: string, subFeatureName?: string): boolean => {
    return checkFeatureEnabledInOrganization(featureName, subFeatureName);
  };

  // CRITICAL FIX: Enhanced access denied reason with specific feedback and guidance
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