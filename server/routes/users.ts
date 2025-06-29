import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Organization from '../models/Organization';
import { authenticateToken } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        role: UserRole;
        organization?: string;
      };
    }
  }
}

// Get platform-level users (ADMIN, SUPERADMIN without organization)
router.get('/platform', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Only SUPERADMIN can access platform users
    if (currentUser?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Access denied. SUPERADMIN role required.' });
    }

    const platformUsers = await User.find({
      role: { $in: ['ADMIN', 'SUPERADMIN'] },
      organization: { $exists: false }
    }).select('-password').sort({ createdAt: -1 });

    res.json({ users: platformUsers });
  } catch (error) {
    console.error('Error fetching platform users:', error);
    res.status(500).json({ error: 'Failed to fetch platform users' });
  }
});

// Get users by organization
router.get('/organization/:organizationId', authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const currentUser = req.user;

    // Check if user has permission to view organization users
    if (currentUser?.role === 'SUPERADMIN') {
      // SUPERADMIN can view any organization
    } else if (currentUser?.role === 'ADMIN') {
      // ADMIN can view organizations they created
      const organization = await Organization.findById(organizationId);
      if (!organization || organization.createdBy !== currentUser._id) {
        return res.status(403).json({ error: 'Access denied to this organization' });
      }
    } else if (currentUser?.role === 'ORGADMIN') {
      // ORGADMIN can only view their own organization
      if (currentUser.organization !== organizationId) {
        return res.status(403).json({ error: 'Access denied to this organization' });
      }
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const users = await User.find({ organization: organizationId })
      .populate('organization', 'name slug')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching organization users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, organizationId } = req.body;
    const currentUser = req.user;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user can create this role
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      SUPERADMIN: ['ADMIN', 'ORGADMIN', 'USER'],
      ADMIN: ['ORGADMIN', 'USER'],
      ORGADMIN: ['USER'],
      USER: [],
    };

    const allowedRoles = roleHierarchy[currentUser?.role as UserRole] || [];
    if (!allowedRoles.includes(role as UserRole)) {
      return res.status(403).json({ error: 'Cannot create user with this role' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Validate organization for non-platform roles
    if (role !== 'ADMIN' && role !== 'SUPERADMIN' && organizationId) {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(400).json({ error: 'Invalid organization' });
      }

      // Check if current user can add users to this organization
      if (currentUser?.role === 'ADMIN') {
        if (organization.createdBy !== currentUser._id) {
          return res.status(403).json({ error: 'Cannot add users to this organization' });
        }
      } else if (currentUser?.role === 'ORGADMIN') {
        if (currentUser.organization !== organizationId) {
          return res.status(403).json({ error: 'Cannot add users to this organization' });
        }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      organization: (role === 'ADMIN' || role === 'SUPERADMIN') ? undefined : organizationId,
      createdBy: currentUser?._id,
      isActive: true,
      permissions: [], // Default empty permissions
    });

    await newUser.save();

    // Return user without password
    const userResponse = await User.findById(newUser._id)
      .populate('organization', 'name slug')
      .select('-password');

    res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user permissions
router.put('/:userId/permissions', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    const currentUser = req.user;

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user can manage this user's permissions
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      SUPERADMIN: ['ADMIN', 'ORGADMIN', 'USER'],
      ADMIN: ['ORGADMIN', 'USER'],
      ORGADMIN: ['USER'],
      USER: [],
    };

    const managableRoles = roleHierarchy[currentUser?.role as UserRole] || [];
    if (!managableRoles.includes(targetUser.role as UserRole)) {
      return res.status(403).json({ error: 'Cannot manage permissions for this user' });
    }

    // Additional organization check for ORGADMIN
    if (currentUser?.role === 'ORGADMIN') {
      if (currentUser.organization !== targetUser.organization?.toString()) {
        return res.status(403).json({ error: 'Cannot manage users outside your organization' });
      }
    }

    // Update permissions
    targetUser.permissions = permissions;
    targetUser.updatedBy = currentUser?._id;
    await targetUser.save();

    const updatedUser = await User.findById(userId)
      .populate('organization', 'name slug')
      .select('-password');

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// Update user status (active/inactive)
router.put('/:userId/status', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const currentUser = req.user;

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user can manage this user
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      SUPERADMIN: ['ADMIN', 'ORGADMIN', 'USER'],
      ADMIN: ['ORGADMIN', 'USER'],
      ORGADMIN: ['USER'],
      USER: [],
    };

    const managableRoles = roleHierarchy[currentUser?.role as UserRole] || [];
    if (!managableRoles.includes(targetUser.role as UserRole)) {
      return res.status(403).json({ error: 'Cannot manage this user' });
    }

    // Update status
    targetUser.isActive = isActive;
    targetUser.updatedBy = currentUser?._id;
    await targetUser.save();

    const updatedUser = await User.findById(userId)
      .populate('organization', 'name slug')
      .select('-password');

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user can delete this user
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      SUPERADMIN: ['ADMIN', 'ORGADMIN', 'USER'],
      ADMIN: ['ORGADMIN', 'USER'],
      ORGADMIN: ['USER'],
      USER: [],
    };

    const managableRoles = roleHierarchy[currentUser?.role as UserRole] || [];
    if (!managableRoles.includes(targetUser.role as UserRole)) {
      return res.status(403).json({ error: 'Cannot delete this user' });
    }

    // Additional organization check for ORGADMIN
    if (currentUser?.role === 'ORGADMIN') {
      if (currentUser.organization !== targetUser.organization?.toString()) {
        return res.status(403).json({ error: 'Cannot delete users outside your organization' });
      }
    }

    // Prevent self-deletion
    if (targetUser._id.toString() === currentUser?._id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all users (for SUPERADMIN)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user;

    // Only SUPERADMIN can view all users
    if (currentUser?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Access denied. SUPERADMIN role required.' });
    }

    const users = await User.find({})
      .populate('organization', 'name slug')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;