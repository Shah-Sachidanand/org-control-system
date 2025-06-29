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

  const hasPermission = (
    feature: string,
    action: PermissionAction = "read",
    subFeature?: string
  ): boolean => {
    if (!user) return false;

    // SUPERADMIN has all permissions
    if (user.role === "SUPERADMIN") return true;

    // Check if user has the specific permission
    const permission = user.permissions.find((p) => p.feature === feature);

    if (!permission?.actions.includes(action)) {
      return false;
    }

    if (subFeature) {
      return permission.subFeatures.includes(subFeature);
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

  // CRITICAL FIX: Enhanced organization feature validation
  const hasOrganizationFeature = (featureName: string, subFeatureName?: string): boolean => {
    if (!user) return false;

    // SUPERADMIN bypasses organization feature restrictions
    if (user.role === "SUPERADMIN") return true;

    // Users without organization cannot access organization features
    if (!user.organization) return false;

    const orgFeature = user.organization.features?.find(f => f.name === featureName);
    
    if (!orgFeature || !orgFeature.isEnabled) {
      return false;
    }

    if (subFeatureName) {
      const subFeature = orgFeature.subFeatures?.find(sf => sf.name === subFeatureName);
      return subFeature?.isEnabled || false;
    }

    return true;
  };

  // CRITICAL FIX: Comprehensive organization feature access validation
  const validateOrganizationFeatureAccess = (featureName: string, subFeatureName?: string): boolean => {
    if (!user) return false;

    // SUPERADMIN bypasses all restrictions
    if (user.role === "SUPERADMIN") return true;

    // Check if user has organization
    if (!user.organization) {
      console.warn(`User ${user.email} has no organization assigned`);
      return false;
    }

    // Check if organization has the feature enabled
    const orgFeature = user.organization.features?.find(f => f.name === featureName);
    
    if (!orgFeature) {
      console.warn(`Feature ${featureName} not found in organization ${user.organization.name}`);
      return false;
    }

    if (!orgFeature.isEnabled) {
      console.warn(`Feature ${featureName} is disabled for organization ${user.organization.name}`);
      return false;
    }

    // Check sub-feature if specified
    if (subFeatureName) {
      const subFeature = orgFeature.subFeatures?.find(sf => sf.name === subFeatureName);
      
      if (!subFeature) {
        console.warn(`Sub-feature ${subFeatureName} not found in feature ${featureName}`);
        return false;
      }

      if (!subFeature.isEnabled) {
        console.warn(`Sub-feature ${subFeatureName} is disabled for organization ${user.organization.name}`);
        return false;
      }
    }

    return true;
  };

  // CRITICAL FIX: Enhanced cross-organization access control
  const checkCrossOrganizationAccess = (targetOrgId: string): boolean => {
    if (!user) return false;

    // SUPERADMIN can access any organization
    if (user.role === "SUPERADMIN") return true;

    // ADMIN can access organizations they created (would need additional validation in real implementation)
    if (user.role === "ADMIN") {
      // In production, you'd check if they created the organization
      // For now, we'll allow ADMIN to access any organization
      return true;
    }

    // ORGADMIN and USER can only access their own organization
    if (user.organization) {
      return user.organization._id === targetOrgId;
    }

    return false;
  };

  const canAccessOrganization = (organizationId: string): boolean => {
    return checkCrossOrganizationAccess(organizationId);
  };

  // CRITICAL FIX: Enhanced feature access with comprehensive validation
const hasFeatureAccess = (
  featureName: string,
  featureLevel?: string
): boolean => {
  if (!user) return false;

  // SUPERADMIN has access to all features
  if (user.role === "SUPERADMIN") return true;

  // Check based on feature level and user role
  switch (featureLevel) {
    case "SYSTEM": {
      return user.role === "SUPERADMIN" as UserRole;;
    }

    case "USER_ROLE": {
      return [UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role);
    }

    case "ORGANIZATION": {
      // Check if user has role access AND organization has feature enabled
      const hasRoleAccess = [UserRole.ORGADMIN, UserRole.ADMIN, UserRole.SUPERADMIN].includes(user.role);
      if (!hasRoleAccess) return false;

      // CRITICAL: Validate organization feature access
      return validateOrganizationFeatureAccess(featureName);
    }

    default: {
      // Check specific permission and organization feature
      const hasUserPermission = hasPermission(featureName);
      const hasOrgFeature = validateOrganizationFeatureAccess(featureName);
      return hasUserPermission && hasOrgFeature;
    }
  }
};

  // CRITICAL FIX: Enhanced access denied reason with specific feedback
  const getAccessDeniedReason = (feature: string, action: PermissionAction = "read", subFeature?: string): string => {
    if (!user) return "You must be logged in to access this feature.";

    // Check if user has organization (for organization-level features)
    if (!user.organization && user.role !== UserRole.SUPERADMIN && user.role !== UserRole.ADMIN) {
      return "You are not assigned to any organization. Contact your administrator to be added to an organization.";
    }

    // Check role requirements first
    const roleHierarchy = [UserRole.USER, UserRole.ORGADMIN, UserRole.ADMIN, UserRole.SUPERADMIN];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    
    if (userRoleIndex === -1) {
      return "Invalid user role. Contact your administrator.";
    }

    // Check organization feature enablement (for non-SUPERADMIN users)
    if (user.role !== "SUPERADMIN" && user.organization) {
      const orgFeature = user.organization.features?.find(f => f.name === feature);
      
      if (!orgFeature) {
        return `The ${feature} feature is not configured for your organization. Contact your administrator to enable this feature.`;
      }

      if (!orgFeature.isEnabled) {
        return `The ${feature} feature is disabled for your organization. Contact your administrator to enable this feature.`;
      }

      if (subFeature) {
        const subFeatureObj = orgFeature.subFeatures?.find(sf => sf.name === subFeature);
        
        if (!subFeatureObj) {
          return `The ${subFeature} sub-feature is not configured for your organization.`;
        }

        if (!subFeatureObj.isEnabled) {
          return `The ${subFeature} sub-feature is disabled for your organization. Contact your administrator to enable this feature.`;
        }
      }
    }

    // Check user permissions
    if (!hasPermission(feature, action, subFeature)) {
      if (subFeature) {
        return `You don't have ${action} access to ${subFeature} in ${feature}. Contact your administrator to request access.`;
      }
      return `You don't have ${action} access to ${feature}. Contact your administrator to request access.`;
    }

    return "Access denied for unknown reason. Contact your administrator.";
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