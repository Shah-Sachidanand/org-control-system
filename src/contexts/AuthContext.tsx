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
    } catch (error) {
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
      SUPERADMIN: ["ADMIN", "ORGADMIN", "USER"],
      ADMIN: ["ORGADMIN", "USER"],
      ORGADMIN: ["USER"],
      USER: [],
    };

    return roleHierarchy[user.role]?.includes(targetRole) || false;
  };

  const hasOrganizationFeature = (featureName: string, subFeatureName?: string): boolean => {
    if (!user || !user.organization) return false;

    // SUPERADMIN bypasses organization feature restrictions
    if (user.role === "SUPERADMIN") return true;

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

  const canAccessOrganization = (organizationId: string): boolean => {
    if (!user) return false;

    // SUPERADMIN can access any organization
    if (user.role === "SUPERADMIN") return true;

    // ADMIN can access organizations they created (this would need additional data)
    if (user.role === "ADMIN") {
      // For now, we'll allow ADMIN to access any organization
      // In a real implementation, you'd check if they created the organization
      return true;
    }

    // ORGADMIN and USER can only access their own organization
    return user.organization?._id === organizationId;
  };

  const hasFeatureAccess = (
    featureName: string,
    featureLevel?: string
  ): boolean => {
    if (!user) return false;

    // SUPERADMIN has access to all features
    if (user.role === "SUPERADMIN") return true;

    // Check based on feature level and user role
    switch (featureLevel) {
      case "SYSTEM":
        return user.role === "SUPERADMIN";
      case "USER_ROLE":
        return ["ADMIN", "SUPERADMIN"].includes(user.role);
      case "ORGANIZATION":
        // Check if user has role access AND organization has feature enabled
        const hasRoleAccess = ["ORGADMIN", "ADMIN", "SUPERADMIN"].includes(user.role);
        if (!hasRoleAccess) return false;
        
        // For organization-level features, check if enabled in user's organization
        return hasOrganizationFeature(featureName);
      default:
        // Check specific permission and organization feature
        const hasUserPermission = hasPermission(featureName);
        const hasOrgFeature = hasOrganizationFeature(featureName);
        return hasUserPermission && hasOrgFeature;
    }
  };

  const getAccessDeniedReason = (feature: string, action: PermissionAction = "read", subFeature?: string): string => {
    if (!user) return "You must be logged in to access this feature.";

    // Check role requirements first
    if (user.role === "USER" && ["ORGADMIN", "ADMIN", "SUPERADMIN"].includes(feature)) {
      return "This feature requires administrator privileges.";
    }

    // Check organization feature enablement
    if (user.organization && !hasOrganizationFeature(feature, subFeature)) {
      if (subFeature) {
        return `The ${subFeature} sub-feature is not enabled for your organization. Contact your administrator to enable this feature.`;
      }
      return `The ${feature} feature is not enabled for your organization. Contact your administrator to enable this feature.`;
    }

    // Check user permissions
    if (!hasPermission(feature, action, subFeature)) {
      if (subFeature) {
        return `You don't have ${action} access to ${subFeature} in ${feature}. Contact your administrator to request access.`;
      }
      return `You don't have ${action} access to ${feature}. Contact your administrator to request access.`;
    }

    return "Access denied for unknown reason.";
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