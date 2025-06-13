import express, { Response } from 'express';
import User from '../models/User';
import { authenticate, authorize, checkRoleHierarchy } from '../middleware/auth';
import { UserRole, IUser, AuthRequest } from '../types';

const router = express.Router();

// Get users in organization
router.get('/organization/:orgId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.params;

    // Check permissions
    if (req?.user?.role === 'USER') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query: Record<string, unknown> = {
      organization: orgId,
      _id: { $ne: req.user?._id }
    };

    if (req?.user?.role === 'ORGADMIN') {
      if (!req.user.organization || req.user.organization._id.toString() !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      query.role = { $nin: ['ADMIN', 'SUPERADMIN'] };
    }

    const users = await User.find(query)
      .populate('organization', 'name')
      .select('-password');

    res.json({ users });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Update user permissions
router.put('/:id/permissions', authenticate, checkRoleHierarchy, async (req: AuthRequest, res: Response) => {
  try {
    const { permissions } = req.body;
    const targetUserId = req.params.id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user can update permissions
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: user not found in request' });
    }
    const canUpdate = checkUpdatePermission(req.user, targetUser);
    if (!canUpdate) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    targetUser.permissions = permissions;
    await targetUser.save();

    const updatedUser = await User.findById(targetUserId)
      .populate('organization')
      .select('-password');

    res.json({ user: updatedUser });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Create user
router.post('/', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, organizationId, permissions } = req.body;

    // Check role hierarchy
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      'SUPERADMIN': ['ADMIN', 'ORGADMIN', 'USER'],
      'ADMIN': ['ORGADMIN', 'USER'],
      'ORGADMIN': ['USER'],
      'USER': []
    };

    const currentUserRole = req?.user?.role as UserRole ?? undefined;
    if (!currentUserRole || !roleHierarchy[currentUserRole].includes(role)) {
      return res.status(403).json({ error: 'Cannot create user with equal or higher role' });
    }

    const userData: Partial<IUser> = {
      email,
      password,
      firstName,
      lastName,
      role,
      permissions: permissions ?? [],
      createdBy: req?.user?._id
    };

    if (organizationId) {
      userData.organization = organizationId;
    } else if (req?.user?.organization) {
      userData.organization = req.user.organization;
    }

    const user = new User(userData);
    await user.save();

    const newUser = await User.findById(user._id)
      .populate('organization')
      .select('-password');

    res.status(201).json({ user: newUser });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

router.get('/', authenticate, authorize('ADMIN', 'SUPERADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ _id: { $ne: req.user?._id } })
      .populate('organization', 'name')
      .select('-password');
    res.json({ users });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Helper function to check update permissions
function checkUpdatePermission(currentUser: IUser, targetUser: IUser): boolean {
  if (currentUser.role === 'SUPERADMIN') return true;

  if (currentUser.role === 'ADMIN') {
    return ['ORGADMIN', 'USER'].includes(targetUser.role);
  }

  if (currentUser.role === 'ORGADMIN') {
    return targetUser.role === 'USER' &&
      currentUser.organization === targetUser.organization
  }

  return false;
}

export default router;