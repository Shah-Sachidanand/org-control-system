import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Organization from '../models/Organization';
import { IUser, UserRole, PermissionAction } from '../types';

interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'your-secret-key') as { userId: string };
    const user = await User.findById(decoded.userId).populate('organization');

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const checkFeatureAccess = (featureName: string, action: PermissionAction = 'read') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // SUPERADMIN has access to everything
    if (req.user.role === 'SUPERADMIN') {
      return next();
    }

    const permission = req.user.permissions.find(p => p.feature === featureName);

    if (!permission?.actions.includes(action)) {
      return res.status(403).json({ error: `No ${action} access to ${featureName}` });
    }

    next();
  };
};

export const checkSubFeatureAccess = (featureName: string, subFeatureName: string, action: PermissionAction = 'read') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // SUPERADMIN has access to everything
    if (req.user.role === 'SUPERADMIN') {
      return next();
    }

    const permission = req.user.permissions.find(p => p.feature === featureName);

    if (!permission ||
      !permission.subFeatures.includes(subFeatureName) ||
      !permission.actions.includes(action)) {
      return res.status(403).json({
        error: `No ${action} access to ${subFeatureName} in ${featureName}`
      });
    }

    next();
  };
};

// CRITICAL FIX: Enhanced organization feature access validation
export const checkOrganizationFeatureAccess = (featureName: string, subFeatureName?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // SUPERADMIN bypasses organization feature restrictions
    if (req.user.role === 'SUPERADMIN') {
      return next();
    }

    // Check if user has an organization
    if (!req.user.organization) {
      return res.status(403).json({ 
        error: 'No organization assigned. Contact your administrator to be added to an organization.' 
      });
    }

    try {
      // Get the full organization with features to ensure we have the latest data
      const organization = await Organization.findById(req.user.organization._id);
      
      if (!organization) {
        return res.status(403).json({ error: 'Organization not found' });
      }

      // Check if the feature exists in the organization
      const orgFeature = organization.features.find(f => f.name === featureName);
      
      if (!orgFeature) {
        return res.status(403).json({ 
          error: `Feature '${featureName}' is not configured for your organization. Contact your administrator.` 
        });
      }

      // Check if the feature is enabled in the organization
      if (!orgFeature.isEnabled) {
        return res.status(403).json({ 
          error: `Feature '${featureName}' is not enabled for your organization. Contact your administrator to enable this feature.` 
        });
      }

      // Check sub-feature if specified
      if (subFeatureName) {
        const subFeature = orgFeature.subFeatures.find(sf => sf.name === subFeatureName);
        
        if (!subFeature) {
          return res.status(403).json({ 
            error: `Sub-feature '${subFeatureName}' is not configured for your organization. Contact your administrator.` 
          });
        }

        if (!subFeature.isEnabled) {
          return res.status(403).json({ 
            error: `Sub-feature '${subFeatureName}' is not enabled for your organization. Contact your administrator to enable this feature.` 
          });
        }
      }

      next();
    } catch (error) {
      console.error('Organization feature check error:', error);
      res.status(500).json({ error: 'Failed to verify organization features' });
    }
  };
};

// CRITICAL FIX: Enhanced organization access control with detailed logging
export const checkOrganizationAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // SUPERADMIN can access any organization
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  const targetOrgId = req.params.orgId || req.body.organizationId || req.query.organizationId;

  if (!targetOrgId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }

  // ADMIN can access organizations they created (this would need additional validation in production)
  if (req.user.role === 'ADMIN') {
    // In production, you'd check if they created the organization
    // For now, allow ADMIN to access any organization but log the access
    console.log(`ADMIN ${req.user.email} accessing organization ${targetOrgId}`);
    return next();
  }

  // ORGADMIN and USER can only access their own organization
  if (req.user.organization && req.user.organization._id.toString() === targetOrgId) {
    return next();
  }

  // Log unauthorized access attempts
  console.warn(`Unauthorized organization access attempt: User ${req.user.email} (${req.user.role}) tried to access organization ${targetOrgId}, but belongs to ${req.user.organization?._id || 'no organization'}`);

  return res.status(403).json({ 
    error: 'Access denied to this organization. You can only access your own organization.' 
  });
};

export const checkRoleHierarchy = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const roleHierarchy: Record<UserRole, UserRole[]> = {
    'SUPERADMIN': ['ADMIN', 'ORGADMIN', 'USER'],
    'ADMIN': ['ORGADMIN', 'USER'],
    'ORGADMIN': ['USER'],
    'USER': []
  };

  const targetRole = req.body.role ?? req.params.role;

  if (targetRole && !roleHierarchy[req.user.role].includes(targetRole)) {
    console.warn(`Role hierarchy violation: ${req.user.email} (${req.user.role}) attempted to manage ${targetRole}`);
    return res.status(403).json({ error: 'Cannot manage users with equal or higher role' });
  }

  next();
};

// CRITICAL FIX: Comprehensive access control middleware combining all checks
export const checkComprehensiveAccess = (
  featureName: string, 
  action: PermissionAction = 'read',
  subFeatureName?: string
) => {
  return [
    authenticate,
    checkFeatureAccess(featureName, action),
    ...(subFeatureName ? [checkSubFeatureAccess(featureName, subFeatureName, action)] : []),
    checkOrganizationFeatureAccess(featureName, subFeatureName)
  ];
};

// CRITICAL FIX: Enhanced data isolation middleware
export const ensureDataIsolation = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // SUPERADMIN can access all data
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  // For non-SUPERADMIN users, ensure they can only access their organization's data
  if (req.user.organization) {
    // Add organization filter to query parameters for data isolation
    req.query.organizationId = req.user.organization._id.toString();
  } else if (req.user.role !== 'ADMIN') {
    // Users without organization (except ADMIN) cannot access any organizational data
    return res.status(403).json({ 
      error: 'No organization assigned. Contact your administrator.' 
    });
  }

  next();
};

// CRITICAL FIX: Audit logging middleware for access attempts
export const auditAccess = (action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      console.log(`AUDIT: User ${req.user.email} (${req.user.role}) ${action} - ${req.method} ${req.originalUrl}`, {
        userId: req.user._id,
        userRole: req.user.role,
        organizationId: req.user.organization?._id,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    next();
  };
};