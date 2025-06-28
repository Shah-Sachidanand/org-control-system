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
        return user.role === "ADMIN";
      case "USER_ROLE":
        return ["ADMIN", "ORGADMIN"].includes(user.role);
      case "ORGANIZATION":
        return ["ORGADMIN", "ADMIN"].includes(user.role);
      default:
        // Check specific permission
        return hasPermission(featureName);
    }
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
