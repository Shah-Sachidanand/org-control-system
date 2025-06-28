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

// NEW: Enhanced organization access control
export const checkOrganizationAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const targetOrgId = req.params.orgId || req.body.organizationId || req.query.organizationId;

  // SUPERADMIN can access any organization
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  // ADMIN can only access organizations they created
  if (req.user.role === 'ADMIN') {
    // We need to verify if the admin created this organization
    // This will be checked in the route handler with additional validation
    return next();
  }

  // ORGADMIN and USER can only access their own organization
  if (req.user.organization && req.user.organization._id.toString() === targetOrgId) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied to this organization' });
};

// NEW: Enhanced admin organization validation
export const checkAdminOrganizationAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // SUPERADMIN bypasses all checks
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  // Only ADMIN role needs this validation
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const targetOrgId = req.params.orgId || req.body.organizationId || req.query.organizationId;

  if (!targetOrgId) {
    return res.status(400).json({ error: 'Organization ID required' });
  }

  try {
    // Check if the admin created this organization
    const organization = await Organization.findOne({
      _id: targetOrgId,
      createdBy: req.user._id
    });

    if (!organization) {
      return res.status(403).json({ 
        error: 'Access denied. You can only access organizations you created.' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin organization access check error:', error);
    res.status(500).json({ error: 'Failed to verify organization access' });
  }
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

// NEW: Comprehensive access validation
export const validateComprehensiveAccess = (
  featureName: string, 
  action: PermissionAction = 'read',
  subFeatureName?: string,
  requireOrgAccess: boolean = true
) => {
  return [
    authenticate,
    checkFeatureAccess(featureName, action),
    ...(subFeatureName ? [checkSubFeatureAccess(featureName, subFeatureName, action)] : []),
    ...(requireOrgAccess ? [checkOrganizationFeatureAccess(featureName, subFeatureName)] : [])
  ];
};

// NEW: Organization-specific user access validation
export const checkUserOrganizationAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // SUPERADMIN can access any user
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  const targetUserId = req.params.userId || req.params.id;
  
  if (!targetUserId) {
    return next(); // No specific user target, proceed with general access
  }

  try {
    const targetUser = await User.findById(targetUserId).populate('organization');
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ADMIN can access users in organizations they created
    if (req.user.role === 'ADMIN') {
      if (!targetUser.organization) {
        return res.status(403).json({ error: 'Target user has no organization' });
      }

      const organization = await Organization.findOne({
        _id: targetUser.organization._id,
        createdBy: req.user._id
      });

      if (!organization) {
        return res.status(403).json({ 
          error: 'Access denied. You can only manage users in organizations you created.' 
        });
      }

      return next();
    }

    // ORGADMIN can only access users in their own organization
    if (req.user.role === 'ORGADMIN') {
      if (!req.user.organization || !targetUser.organization) {
        return res.status(403).json({ error: 'Organization access required' });
      }

      if (req.user.organization._id.toString() !== targetUser.organization._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied. You can only manage users in your organization.' 
        });
      }

      return next();
    }

    // USER cannot access other users
    return res.status(403).json({ error: 'Insufficient permissions to access user data' });

  } catch (error) {
    console.error('User organization access check error:', error);
    res.status(500).json({ error: 'Failed to verify user access' });
  }
};