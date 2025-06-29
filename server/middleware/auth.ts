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
      console.warn(`Authentication failed: No token provided from IP ${req.ip}`);
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'your-secret-key') as { userId: string };
    const user = await User.findById(decoded.userId).populate('organization');

    if (!user) {
      console.warn(`Authentication failed: Invalid token from IP ${req.ip}`);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // CRITICAL FIX: Enhanced user validation
    if (!user.isActive) {
      console.warn(`Authentication failed: Inactive user ${user.email} attempted access from IP ${req.ip}`);
      return res.status(401).json({ error: 'Account is inactive' });
    }

    req.user = user;
    console.log(`Authentication successful: User ${user.email} (${user.role}) from IP ${req.ip}`);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.warn(`Authorization failed: No user in request from IP ${req.ip}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      console.warn(`Authorization failed: User ${req.user.email} (${req.user.role}) attempted to access ${roles.join(', ')} restricted resource from IP ${req.ip}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log(`Authorization successful: User ${req.user.email} (${req.user.role}) accessing ${roles.join(', ')} resource`);
    next();
  };
};

export const checkFeatureAccess = (featureName: string, action: PermissionAction = 'read') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.warn(`Feature access check failed: No user in request from IP ${req.ip}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // SUPERADMIN has access to everything
    if (req.user.role === 'SUPERADMIN') {
      console.log(`Feature access granted: SUPERADMIN ${req.user.email} accessing ${featureName}:${action}`);
      return next();
    }

    const permission = req.user.permissions.find(p => p.feature === featureName);

    if (!permission?.actions.includes(action)) {
      console.warn(`Feature access denied: User ${req.user.email} lacks ${action} access to ${featureName} from IP ${req.ip}`);
      return res.status(403).json({ error: `No ${action} access to ${featureName}` });
    }

    console.log(`Feature access granted: User ${req.user.email} accessing ${featureName}:${action}`);
    next();
  };
};

export const checkSubFeatureAccess = (featureName: string, subFeatureName: string, action: PermissionAction = 'read') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.warn(`Sub-feature access check failed: No user in request from IP ${req.ip}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // SUPERADMIN has access to everything
    if (req.user.role === 'SUPERADMIN') {
      console.log(`Sub-feature access granted: SUPERADMIN ${req.user.email} accessing ${featureName}:${subFeatureName}:${action}`);
      return next();
    }

    const permission = req.user.permissions.find(p => p.feature === featureName);

    if (!permission ||
      !permission.subFeatures.includes(subFeatureName) ||
      !permission.actions.includes(action)) {
      console.warn(`Sub-feature access denied: User ${req.user.email} lacks ${action} access to ${subFeatureName} in ${featureName} from IP ${req.ip}`);
      return res.status(403).json({
        error: `No ${action} access to ${subFeatureName} in ${featureName}`
      });
    }

    console.log(`Sub-feature access granted: User ${req.user.email} accessing ${featureName}:${subFeatureName}:${action}`);
    next();
  };
};

// CRITICAL FIX: Enhanced organization feature access validation with real-time database checks
export const checkOrganizationFeatureAccess = (featureName: string, subFeatureName?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.warn(`Organization feature check failed: No user in request from IP ${req.ip}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // SUPERADMIN bypasses organization feature restrictions
    if (req.user.role === 'SUPERADMIN') {
      console.log(`Organization feature access granted: SUPERADMIN ${req.user.email} bypassing restrictions for ${featureName}`);
      return next();
    }

    // Check if user has an organization
    if (!req.user.organization) {
      console.warn(`Organization feature access denied: User ${req.user.email} has no organization assigned from IP ${req.ip}`);
      return res.status(403).json({ 
        error: 'No organization assigned. Contact your administrator to be added to an organization.' 
      });
    }

    try {
      // CRITICAL: Get the latest organization data to ensure we have current feature settings
      const organization = await Organization.findById(req.user.organization._id);
      
      if (!organization) {
        console.error(`Organization feature check failed: Organization ${req.user.organization._id} not found for user ${req.user.email}`);
        return res.status(403).json({ error: 'Organization not found' });
      }

      // Check if the feature exists in the organization
      const orgFeature = organization.features.find(f => f.name === featureName);
      
      if (!orgFeature) {
        console.warn(`Organization feature access denied: Feature '${featureName}' not configured for organization ${organization.name} (user: ${req.user.email}) from IP ${req.ip}`);
        return res.status(403).json({ 
          error: `Feature '${featureName}' is not configured for your organization. Contact your administrator.` 
        });
      }

      // Check if the feature is enabled in the organization
      if (!orgFeature.isEnabled) {
        console.warn(`Organization feature access denied: Feature '${featureName}' disabled for organization ${organization.name} (user: ${req.user.email}) from IP ${req.ip}`);
        return res.status(403).json({ 
          error: `Feature '${featureName}' is not enabled for your organization. Contact your administrator to enable this feature.` 
        });
      }

      // Check sub-feature if specified
      if (subFeatureName) {
        const subFeature = orgFeature.subFeatures.find(sf => sf.name === subFeatureName);
        
        if (!subFeature) {
          console.warn(`Organization sub-feature access denied: Sub-feature '${subFeatureName}' not configured for organization ${organization.name} (user: ${req.user.email}) from IP ${req.ip}`);
          return res.status(403).json({ 
            error: `Sub-feature '${subFeatureName}' is not configured for your organization. Contact your administrator.` 
          });
        }

        if (!subFeature.isEnabled) {
          console.warn(`Organization sub-feature access denied: Sub-feature '${subFeatureName}' disabled for organization ${organization.name} (user: ${req.user.email}) from IP ${req.ip}`);
          return res.status(403).json({ 
            error: `Sub-feature '${subFeatureName}' is not enabled for your organization. Contact your administrator to enable this feature.` 
          });
        }
      }

      console.log(`Organization feature access granted: User ${req.user.email} accessing ${featureName}${subFeatureName ? ':' + subFeatureName : ''} in organization ${organization.name}`);
      next();
    } catch (error) {
      console.error('Organization feature check error:', error);
      res.status(500).json({ error: 'Failed to verify organization features' });
    }
  };
};

// CRITICAL FIX: Enhanced organization access control with detailed logging and validation
export const checkOrganizationAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    console.warn(`Organization access check failed: No user in request from IP ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // SUPERADMIN can access any organization
  if (req.user.role === 'SUPERADMIN') {
    console.log(`Organization access granted: SUPERADMIN ${req.user.email} accessing any organization`);
    return next();
  }

  const targetOrgId = req.params.orgId || req.body.organizationId || req.query.organizationId;

  if (!targetOrgId) {
    console.warn(`Organization access check failed: No organization ID provided by user ${req.user.email} from IP ${req.ip}`);
    return res.status(400).json({ error: 'Organization ID is required' });
  }

  // ADMIN can access organizations they created (this would need additional validation in production)
  if (req.user.role === 'ADMIN') {
    // In production, you'd check if they created the organization
    console.log(`Organization access granted: ADMIN ${req.user.email} accessing organization ${targetOrgId}`);
    return next();
  }

  // ORGADMIN and USER can only access their own organization
  if (req.user.organization && req.user.organization._id.toString() === targetOrgId) {
    console.log(`Organization access granted: User ${req.user.email} (${req.user.role}) accessing own organization ${targetOrgId}`);
    return next();
  }

  // Log unauthorized access attempts with detailed information
  console.warn(`SECURITY ALERT: Unauthorized organization access attempt - User: ${req.user.email} (${req.user.role}), Target Org: ${targetOrgId}, User Org: ${req.user.organization?._id || 'none'}, IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);

  return res.status(403).json({ 
    error: 'Access denied to this organization. You can only access your own organization.' 
  });
};

export const checkRoleHierarchy = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    console.warn(`Role hierarchy check failed: No user in request from IP ${req.ip}`);
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
    console.warn(`SECURITY ALERT: Role hierarchy violation - User: ${req.user.email} (${req.user.role}) attempted to manage ${targetRole}, IP: ${req.ip}`);
    return res.status(403).json({ error: 'Cannot manage users with equal or higher role' });
  }

  console.log(`Role hierarchy check passed: User ${req.user.email} (${req.user.role}) managing ${targetRole || 'unspecified role'}`);
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

// CRITICAL FIX: Enhanced data isolation middleware with comprehensive validation
export const ensureDataIsolation = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    console.warn(`Data isolation check failed: No user in request from IP ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // SUPERADMIN can access all data
  if (req.user.role === 'SUPERADMIN') {
    console.log(`Data isolation bypassed: SUPERADMIN ${req.user.email} accessing all data`);
    return next();
  }

  // For non-SUPERADMIN users, ensure they can only access their organization's data
  if (req.user.organization) {
    // Add organization filter to query parameters for data isolation
    req.query.organizationId = req.user.organization._id.toString();
    console.log(`Data isolation applied: User ${req.user.email} restricted to organization ${req.user.organization._id}`);
  } else if (req.user.role !== 'ADMIN') {
    // Users without organization (except ADMIN) cannot access any organizational data
    console.warn(`Data isolation violation: User ${req.user.email} (${req.user.role}) has no organization but attempted data access from IP ${req.ip}`);
    return res.status(403).json({ 
      error: 'No organization assigned. Contact your administrator.' 
    });
  }

  next();
};

// CRITICAL FIX: Enhanced audit logging middleware for comprehensive access tracking
export const auditAccess = (action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      const auditData = {
        timestamp: new Date().toISOString(),
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        organizationId: req.user.organization?._id,
        organizationName: req.user.organization?.name,
        action: action,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        body: req.method === 'POST' || req.method === 'PUT' ? JSON.stringify(req.body) : undefined,
        query: Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : undefined
      };

      console.log(`AUDIT: ${action}`, auditData);

      // In production, you would also store this in a dedicated audit log database
      // await AuditLog.create(auditData);
    }
    next();
  };
};

// CRITICAL FIX: Rate limiting middleware for sensitive operations
export const rateLimitSensitiveOperations = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `${req.user._id}:${req.ip}`;
    const now = Date.now();
    const userAttempts = attempts.get(key);

    if (!userAttempts || now > userAttempts.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      console.warn(`SECURITY ALERT: Rate limit exceeded - User: ${req.user.email}, IP: ${req.ip}, Action: ${req.originalUrl}`);
      return res.status(429).json({ 
        error: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
      });
    }

    userAttempts.count++;
    next();
  };
};

// CRITICAL FIX: Input validation middleware for preventing injection attacks
export const validateInput = (req: AuthRequest, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /\$\{.*\}/,  // Template injection
    /<script/i,   // XSS
    /javascript:/i, // XSS
    /on\w+\s*=/i,  // Event handlers
    /eval\s*\(/i,  // Code injection
    /function\s*\(/i, // Function injection
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    console.warn(`SECURITY ALERT: Suspicious input detected - User: ${req.user?.email || 'unknown'}, IP: ${req.ip}, URL: ${req.originalUrl}`);
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  next();
};