import express, { Response } from 'express';
import User from '../models/User';
import Organization from '../models/Organization';
import { authenticate, authorize, checkRoleHierarchy, checkUserOrganizationAccess } from '../middleware/auth';
import { UserRole, IUser, AuthRequest } from '../types';

const router = express.Router();

// Get users in organization - Enhanced access control
router.get('/organization/:orgId', authenticate, checkUserOrganizationAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check permissions based on role
    if (currentUser.role === 'USER') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query: Record<string, unknown> = {
      organization: orgId,
      _id: { $ne: currentUser._id }
    };

    // Role-specific filtering
    if (currentUser.role === 'SUPERADMIN') {
      // SUPERADMIN can see all users in any organization
      // No additional filtering needed
    } else if (currentUser.role === 'ADMIN') {
      // ADMIN can see users in organizations they created
      const organization = await Organization.findOne({
        _id: orgId,
        createdBy: currentUser._id
      });

      if (!organization) {
        return res.status(403).json({ error: 'Access denied to this organization' });
      }

      // Exclude SUPERADMIN and other ADMINs
      query.role = { $nin: ['SUPERADMIN', 'ADMIN'] };
    } else if (currentUser.role === 'ORGADMIN') {
      // ORGADMIN can only see users in their own organization
      if (!currentUser.organization || currentUser.organization._id.toString() !== orgId) {
        return res.status(403).json({ error: 'Access denied to this organization' });
      }

      // Exclude SUPERADMIN, ADMIN, and other ORGADMINs
      query.role = { $nin: ['SUPERADMIN', 'ADMIN', 'ORGADMIN'] };
    }

    const users = await User.find(query)
      .populate('organization', 'name')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Get all users - Enhanced access control
router.get('/', authenticate, authorize('ADMIN', 'SUPERADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let query: Record<string, unknown> = {
      _id: { $ne: currentUser._id }
    };

    if (currentUser.role === 'SUPERADMIN') {
      // SUPERADMIN can see all users except other SUPERADMINs
      query.role = { $ne: 'SUPERADMIN' };
    } else if (currentUser.role === 'ADMIN') {
      // ADMIN can only see users in organizations they created
      const createdOrgs = await Organization.find({ createdBy: currentUser._id }).select('_id');
      const orgIds = createdOrgs.map(org => org._id);

      query = {
        ...query,
        $or: [
          { organization: { $in: orgIds } },
          { organization: null, role: { $in: ['ORGADMIN', 'USER'] } } // Users without organization
        ],
        role: { $nin: ['SUPERADMIN', 'ADMIN'] }
      };
    }

    const users = await User.find(query)
      .populate('organization', 'name')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Update user permissions - Enhanced access control
router.put('/:id/permissions', authenticate, checkRoleHierarchy, checkUserOrganizationAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { permissions } = req.body;
    const targetUserId = req.params.id;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const targetUser = await User.findById(targetUserId).populate('organization');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Enhanced permission validation
    const canUpdate = await checkUpdatePermission(currentUser, targetUser);
    if (!canUpdate.allowed) {
      return res.status(403).json({ error: canUpdate.reason });
    }

    // Validate permissions structure
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
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

// Create user - Enhanced access control
router.post('/', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, organizationId, permissions } = req.body;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Role hierarchy validation
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      'SUPERADMIN': ['ADMIN', 'ORGADMIN', 'USER'],
      'ADMIN': ['ORGADMIN', 'USER'],
      'ORGADMIN': ['USER'],
      'USER': []
    };

    if (!roleHierarchy[currentUser.role].includes(role)) {
      return res.status(403).json({ error: 'Cannot create user with equal or higher role' });
    }

    // Organization validation
    let targetOrgId = organizationId;

    if (currentUser.role === 'ORGADMIN') {
      // ORGADMIN can only create users in their own organization
      if (!currentUser.organization) {
        return res.status(403).json({ error: 'No organization assigned' });
      }
      targetOrgId = currentUser.organization._id;
    } else if (currentUser.role === 'ADMIN') {
      // ADMIN can create users in organizations they created
      if (organizationId) {
        const organization = await Organization.findOne({
          _id: organizationId,
          createdBy: currentUser._id
        });

        if (!organization) {
          return res.status(403).json({ error: 'Access denied to this organization' });
        }
      }
    }
    // SUPERADMIN can create users in any organization

    const userData: Partial<IUser> = {
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      permissions: permissions ?? [],
      createdBy: currentUser._id
    };

    if (targetOrgId) {
      userData.organization = targetOrgId;
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

// Delete user - Enhanced access control
router.delete('/:id', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), checkUserOrganizationAccess, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const targetUser = await User.findById(targetUserId).populate('organization');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-deletion
    if (targetUser._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Enhanced permission validation
    const canDelete = await checkUpdatePermission(currentUser, targetUser);
    if (!canDelete.allowed) {
      return res.status(403).json({ error: canDelete.reason });
    }

    await User.findByIdAndDelete(targetUserId);

    res.json({ message: 'User deleted successfully' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Enhanced permission checking function
async function checkUpdatePermission(currentUser: IUser, targetUser: IUser): Promise<{ allowed: boolean; reason?: string }> {
  if (currentUser.role === 'SUPERADMIN') {
    return { allowed: true };
  }

  if (currentUser.role === 'ADMIN') {
    // ADMIN can manage ORGADMIN and USER in organizations they created
    if (!['ORGADMIN', 'USER'].includes(targetUser.role)) {
      return { allowed: false, reason: 'Cannot manage users with equal or higher role' };
    }

    if (targetUser.organization) {
      const organization = await Organization.findOne({
        _id: targetUser.organization._id,
        createdBy: currentUser._id
      });

      if (!organization) {
        return { allowed: false, reason: 'Access denied. You can only manage users in organizations you created.' };
      }
    }

    return { allowed: true };
  }

  if (currentUser.role === 'ORGADMIN') {
    // ORGADMIN can only manage USER in their own organization
    if (targetUser.role !== 'USER') {
      return { allowed: false, reason: 'Can only manage USER role' };
    }

    if (!currentUser.organization || !targetUser.organization) {
      return { allowed: false, reason: 'Organization access required' };
    }

    if (currentUser.organization._id.toString() !== targetUser.organization._id.toString()) {
      return { allowed: false, reason: 'Can only manage users in your organization' };
    }

    return { allowed: true };
  }

  return { allowed: false, reason: 'Insufficient permissions' };
}

export default router;