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
      return res.status(403).json({ error: 'No organization assigned' });
    }

    try {
      // Get the full organization with features
      const organization = await Organization.findById(req.user.organization._id);
      
      if (!organization) {
        return res.status(403).json({ error: 'Organization not found' });
      }

      // Check if the feature is enabled in the organization
      const orgFeature = organization.features.find(f => f.name === featureName);
      
      if (!orgFeature || !orgFeature.isEnabled) {
        return res.status(403).json({ 
          error: `Feature '${featureName}' is not enabled for your organization` 
        });
      }

      // Check sub-feature if specified
      if (subFeatureName) {
        const subFeature = orgFeature.subFeatures.find(sf => sf.name === subFeatureName);
        
        if (!subFeature || !subFeature.isEnabled) {
          return res.status(403).json({ 
            error: `Sub-feature '${subFeatureName}' is not enabled for your organization` 
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

export const checkOrganizationAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // SUPERADMIN can access any organization
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  const targetOrgId = req.params.orgId || req.body.organizationId || req.query.organizationId;

  // ADMIN can access organizations they created (this would need additional validation)
  if (req.user.role === 'ADMIN') {
    // For now, allow ADMIN to access any organization
    // In production, you'd check if they created the organization
    return next();
  }

  // ORGADMIN and USER can only access their own organization
  if (req.user.organization && req.user.organization._id.toString() === targetOrgId) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied to this organization' });
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
    return res.status(403).json({ error: 'Cannot manage users with equal or higher role' });
  }

  next();
};

// Combined middleware for comprehensive access control
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