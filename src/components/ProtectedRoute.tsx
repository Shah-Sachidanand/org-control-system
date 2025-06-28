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
    validateOrganizationFeatureAccess,
    checkCrossOrganizationAccess,
    getAccessDeniedReason
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

  // CRITICAL FIX: Enhanced organization access validation
  if (organizationId && !checkCrossOrganizationAccess(organizationId)) {
    console.warn(`User ${user.email} attempted to access organization ${organizationId} without permission`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Check role requirement with proper hierarchy validation
  if (requiredRole && !hasRole(requiredRole)) {
    const roleHierarchy = ["USER", "ORGADMIN", "ADMIN", "SUPERADMIN"];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex < requiredRoleIndex) {
      console.warn(`User ${user.email} with role ${user.role} attempted to access ${requiredRole} required resource`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check if user has any of the required roles
  if (requireAnyRole && !requireAnyRole.some((role) => hasRole(role))) {
    console.warn(`User ${user.email} attempted to access resource requiring roles: ${requireAnyRole.join(', ')}`);
    return <Navigate to="/unauthorized" replace />;
  }

  // CRITICAL FIX: Enhanced permission requirement validation with organization feature checks
  if (requiredPermission) {
    const { feature, action = "read", subFeature } = requiredPermission;
    
    // First check if user has the permission
    const hasUserPermission = hasPermission(feature, action, subFeature);
    
    if (!hasUserPermission) {
      console.warn(`User ${user.email} lacks permission: ${feature}:${subFeature || 'none'}:${action}`);
      return <Navigate to="/unauthorized" replace />;
    }

    // CRITICAL: Then check if the feature is enabled in the organization (for organization-level features)
    const isSystemFeature = featureLevel === "SYSTEM";
    const isUserRoleFeature = featureLevel === "USER_ROLE";
    
    if (!isSystemFeature && !isUserRoleFeature) {
      const hasOrgFeature = validateOrganizationFeatureAccess(feature, subFeature);
      
      if (!hasOrgFeature) {
        const reason = getAccessDeniedReason(feature, action, subFeature);
        console.warn(`Organization feature access denied for user ${user.email}: ${reason}`);
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  // CRITICAL FIX: Enhanced feature access validation with level-specific checks
  if (featureLevel && requiredPermission) {
    const hasAccess = hasFeatureAccess(requiredPermission.feature, featureLevel);
    if (!hasAccess) {
      console.warn(`User ${user.email} lacks feature access: ${requiredPermission.feature} at level ${featureLevel}`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};