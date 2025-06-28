import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserRole, PermissionAction } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: {
    feature: string;
    action?: PermissionAction;
    subFeature?: string;
  };
  requireAnyRole?: UserRole[];
  organizationId?: string;
  featureLevel?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  requireAnyRole,
  organizationId,
  featureLevel,
}) => {
  const { 
    user, 
    loading, 
    hasPermission, 
    hasRole, 
    hasFeatureAccess, 
    hasOrganizationFeature,
    canAccessOrganization 
  } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check organization access if organizationId is provided
  if (organizationId && !canAccessOrganization(organizationId)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    // Check role hierarchy for access
    const roleHierarchy = ["USER", "ORGADMIN", "ADMIN", "SUPERADMIN"];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex < requiredRoleIndex) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check if user has any of the required roles
  if (requireAnyRole && !requireAnyRole.some((role) => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission requirement with organization feature validation
  if (requiredPermission) {
    const { feature, action = "read", subFeature } = requiredPermission;
    
    // First check if user has the permission
    const hasUserPermission = hasPermission(feature, action, subFeature);
    
    // Then check if the feature is enabled in the organization (for organization-level features)
    const hasOrgFeature = user.organization ? hasOrganizationFeature(feature, subFeature) : true;
    
    // For system-level features, skip organization check
    const isSystemFeature = featureLevel === "SYSTEM";
    
    if (!hasUserPermission || (!isSystemFeature && !hasOrgFeature)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check feature access with level validation
  if (featureLevel && requiredPermission) {
    const hasAccess = hasFeatureAccess(requiredPermission.feature, featureLevel);
    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};