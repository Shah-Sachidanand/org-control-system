import express, { Request, Response } from 'express';
import User from '../models/User';
import Feature from '../models/Feature';
import { authenticate } from '../middleware/auth';
import { PermissionCheckRequest } from '../types/index';

const router = express.Router();

// Get user permissions
router.get('/user/:userId', authenticate, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('organization')
      .select('permissions role organization');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ permissions: user.permissions, role: user.role });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check specific permission
router.post('/check', authenticate, async (req: Request<{}, {}, PermissionCheckRequest>, res: Response) => {
  try {
    const { feature, subFeature, action } = req.body;
    const user = (req as any).user;

    let hasAccess = false;

    if (user.role === 'SUPERADMIN') {
      hasAccess = true;
    } else {
      const permission = user.permissions.find((p: any) => p.feature === feature);

      if (permission && permission.actions.includes(action)) {
        if (subFeature) {
          hasAccess = permission.subFeatures.includes(subFeature);
        } else {
          hasAccess = true;
        }
      }
    }

    res.json({ hasAccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get available features for organization
router.get('/organization/:orgId/features', authenticate, async (req: any, res: Response) => {
  try {
    const features = await Feature.find();

    // Filter features based on user role
    const availableFeatures = features.filter(feature => {
      const roleHierarchy = ['USER', 'ORGADMIN', 'ADMIN', 'SUPERADMIN'];
      const userRoleIndex = roleHierarchy.indexOf(req.user.role);
      const requiredRoleIndex = roleHierarchy.indexOf(feature.requiredRole);

      return userRoleIndex >= requiredRoleIndex;
    });

    res.json({ features: availableFeatures });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;