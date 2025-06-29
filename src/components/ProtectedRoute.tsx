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
    getAccessDeniedReason,
    validateUserOrganizationMembership,
    auditAccessAttempt,
    validateFeatureHierarchy,
    checkSystemLevelAccess
  } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    auditAccessAttempt("protected_route", "access", false, "No authenticated user");
    return <Navigate to="/login" replace />;
  }

  // CRITICAL FIX: Enhanced organization membership validation with detailed audit logging
  if (!validateUserOrganizationMembership()) {
    auditAccessAttempt("protected_route", "organization_membership", false, `User ${user.email} failed organization membership validation`);
    return <Navigate to="/unauthorized" replace />;
  }

  // CRITICAL FIX: Enhanced organization access validation with comprehensive security checks
  if (organizationId && !checkCrossOrganizationAccess(organizationId)) {
    auditAccessAttempt("protected_route", "cross_organization", false, `User ${user.email} attempted unauthorized access to organization ${organizationId}`);
    return <Navigate to="/unauthorized" replace />;
  }

  // CRITICAL FIX: Enhanced role requirement validation with proper hierarchy checking and audit logging
  if (requiredRole && !hasRole(requiredRole)) {
    const roleHierarchy = ["USER", "ORGADMIN", "ADMIN", "SUPERADMIN"];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex < requiredRoleIndex) {
      auditAccessAttempt("protected_route", "role_check", false, `User ${user.email} with role ${user.role} attempted to access ${requiredRole} required resource`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // CRITICAL FIX: Enhanced multiple role validation with comprehensive logging
  if (requireAnyRole && !requireAnyRole.some((role) => hasRole(role))) {
    auditAccessAttempt("protected_route", "multi_role_check", false, `User ${user.email} attempted to access resource requiring roles: ${requireAnyRole.join(', ')}`);
    return <Navigate to="/unauthorized" replace />;
  }

  // CRITICAL FIX: Enhanced permission requirement validation with comprehensive organization feature checks
  if (requiredPermission) {
    const { feature, action = "read", subFeature } = requiredPermission;
    
    // Check feature hierarchy first
    if (!validateFeatureHierarchy(feature, subFeature)) {
      auditAccessAttempt("protected_route", "feature_hierarchy", false, `User ${user.email} failed feature hierarchy check for ${feature}`);
      return <Navigate to="/unauthorized" replace />;
    }
    
    // Check if it's a system-level feature
    if (checkSystemLevelAccess(feature)) {
      if (user.role !== "SUPERADMIN") {
        auditAccessAttempt("protected_route", "system_access", false, `User ${user.email} attempted to access system feature ${feature} without SUPERADMIN role`);
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      // For non-system features, check user permissions
      const hasUserPermission = hasPermission(feature, action, subFeature);
      
      if (!hasUserPermission) {
        auditAccessAttempt("protected_route", "permission_check", false, `User ${user.email} lacks permission: ${feature}:${subFeature || 'none'}:${action}`);
        return <Navigate to="/unauthorized" replace />;
      }

      // CRITICAL: Then check if the feature is enabled in the organization (for organization-level features)
      const isSystemFeature = featureLevel === "SYSTEM";
      const isUserRoleFeature = featureLevel === "USER_ROLE";
      
      if (!isSystemFeature && !isUserRoleFeature) {
        const hasOrgFeature = validateOrganizationFeatureAccess(feature, subFeature);
        
        if (!hasOrgFeature) {
          const reason = getAccessDeniedReason(feature, action, subFeature);
          auditAccessAttempt("protected_route", "org_feature_check", false, `Organization feature access denied for user ${user.email}: ${reason}`);
          return <Navigate to="/unauthorized" replace />;
        }
      }
    }
  }

  // CRITICAL FIX: Enhanced feature access validation with level-specific checks and comprehensive audit logging
  if (featureLevel && requiredPermission) {
    const hasAccess = hasFeatureAccess(requiredPermission.feature, featureLevel);
    if (!hasAccess) {
      auditAccessAttempt("protected_route", "feature_level_check", false, `User ${user.email} lacks feature access: ${requiredPermission.feature} at level ${featureLevel}`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // CRITICAL FIX: Additional security validation for sensitive operations with enhanced logging
  if (requiredPermission?.action === "delete" || requiredPermission?.action === "manage") {
    // Extra validation for destructive operations
    if (user.role === "USER") {
      auditAccessAttempt("protected_route", "destructive_operation", false, `USER ${user.email} attempted destructive operation: ${requiredPermission.action} on ${requiredPermission.feature}`);
      return <Navigate to="/unauthorized" replace />;
    }

    // Additional validation for cross-organization destructive operations
    if (organizationId && user.organization && user.organization._id !== organizationId && user.role !== "SUPERADMIN") {
      auditAccessAttempt("protected_route", "cross_org_destructive", false, `User ${user.email} attempted cross-organization destructive operation`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // CRITICAL FIX: Enhanced session validation and security checks
  if (user && user.isActive === false) {
    auditAccessAttempt("protected_route", "inactive_user", false, `Inactive user ${user.email} attempted access`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Log successful access for comprehensive audit trail
  const accessDetails = {
    feature: requiredPermission?.feature || 'general',
    action: requiredPermission?.action || 'access',
    subFeature: requiredPermission?.subFeature,
    featureLevel,
    organizationId,
    requiredRole,
    requireAnyRole
  };
  
  auditAccessAttempt("protected_route", "access_granted", true, `Access granted with details: ${JSON.stringify(accessDetails)}`);

  return <>{children}</>;
};