import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
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