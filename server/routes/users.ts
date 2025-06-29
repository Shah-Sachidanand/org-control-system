import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { auth } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

// Get all users (SUPERADMIN only)
router.get('/', auth, async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await User.find({ role: { $ne: 'SUPERADMIN' } })
      .populate('organization', 'name slug')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get platform-level users (ADMIN and SUPERADMIN without organization)
router.get('/platform', auth, async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find users with ADMIN or SUPERADMIN role who don't have an organization assigned
    const platformUsers = await User.find({
      $and: [
        { role: { $in: ['ADMIN', 'SUPERADMIN'] } },
        { $or: [{ organization: null }, { organization: { $exists: false } }] }
      ]
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users: platformUsers });
  } catch (error) {
    console.error('Error fetching platform users:', error);
    res.status(500).json({ error: 'Failed to fetch platform users' });
  }
});

// Get users by organization
router.get('/organization/:organizationId', auth, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { role, organization: userOrg } = req.user;

    // Check access permissions
    if (role === 'SUPERADMIN') {
      // SUPERADMIN can access any organization
    } else if (role === 'ADMIN') {
      // ADMIN can access organizations they created
      const org = await Organization.findById(organizationId);
      if (!org || org.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (role === 'ORGADMIN') {
      // ORGADMIN can only access their own organization
      if (!userOrg || userOrg._id.toString() !== organizationId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await User.find({ organization: organizationId })
      .populate('organization', 'name slug')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching organization users:', error);
    res.status(500).json({ error: 'Failed to fetch organization users' });
  }
});

// Create user
router.post('/', auth, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, organizationId, permissions = [] } = req.body;
    const { role: userRole, organization: userOrg } = req.user;

    // Validate role hierarchy
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      SUPERADMIN: ['ADMIN', 'ORGADMIN', 'USER'],
      ADMIN: ['ORGADMIN', 'USER'],
      ORGADMIN: ['USER'],
      USER: [],
    };

    if (!roleHierarchy[userRole]?.includes(role)) {
      return res.status(403).json({ error: 'Cannot create user with this role' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Determine organization assignment
    let assignedOrganization = null;
    
    if (role === 'ADMIN' || role === 'SUPERADMIN') {
      // Platform-level users don't need organization assignment
      assignedOrganization = null;
    } else {
      // Organization-level users need organization assignment
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization is required for this role' });
      }

      // Validate organization access
      if (userRole === 'ADMIN') {
        const org = await Organization.findById(organizationId);
        if (!org || org.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: 'Cannot assign user to this organization' });
        }
      } else if (userRole === 'ORGADMIN') {
        if (!userOrg || userOrg._id.toString() !== organizationId) {
          return res.status(403).json({ error: 'Cannot assign user to this organization' });
        }
      }

      assignedOrganization = organizationId;
    }

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      organization: assignedOrganization,
      permissions,
      createdBy: req.user._id,
    });

    await user.save();

    // Populate organization for response
    await user.populate('organization', 'name slug');

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user permissions
router.put('/:userId/permissions', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    const { role: userRole, organization: userOrg } = req.user;

    // Find the target user
    const targetUser = await User.findById(userId).populate('organization');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user can manage target user
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      SUPERADMIN: ['ADMIN', 'ORGADMIN', 'USER'],
      ADMIN: ['ORGADMIN', 'USER'],
      ORGADMIN: ['USER'],
      USER: [],
    };

    if (!roleHierarchy[userRole]?.includes(targetUser.role)) {
      return res.status(403).json({ error: 'Cannot manage this user' });
    }

    // Check organization access
    if (userRole === 'ORGADMIN') {
      if (!userOrg || !targetUser.organization || 
          userOrg._id.toString() !== targetUser.organization._id.toString()) {
        return res.status(403).json({ error: 'Cannot manage user from different organization' });
      }
    } else if (userRole === 'ADMIN') {
      if (targetUser.organization) {
        const org = await Organization.findById(targetUser.organization._id);
        if (!org || org.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: 'Cannot manage user from this organization' });
        }
      }
    }

    // Update permissions
    targetUser.permissions = permissions;
    targetUser.updatedBy = req.user._id;
    await targetUser.save();

    // Populate and return updated user
    await targetUser.populate('organization', 'name slug');
    const userResponse = targetUser.toObject();
    delete userResponse.password;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({ error: 'Failed to update user permissions' });
  }
});

// Update user status
router.put('/:userId/status', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const { role: userRole, organization: userOrg } = req.user;

    // Find the target user
    const targetUser = await User.findById(userId).populate('organization');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user can manage target user
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      SUPERADMIN: ['ADMIN', 'ORGADMIN', 'USER'],
      ADMIN: ['ORGADMIN', 'USER'],
      ORGADMIN: ['USER'],
      USER: [],
    };

    if (!roleHierarchy[userRole]?.includes(targetUser.role)) {
      return res.status(403).json({ error: 'Cannot manage this user' });
    }

    // Check organization access
    if (userRole === 'ORGADMIN') {
      if (!userOrg || !targetUser.organization || 
          userOrg._id.toString() !== targetUser.organization._id.toString()) {
        return res.status(403).json({ error: 'Cannot manage user from different organization' });
      }
    } else if (userRole === 'ADMIN') {
      if (targetUser.organization) {
        const org = await Organization.findById(targetUser.organization._id);
        if (!org || org.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: 'Cannot manage user from this organization' });
        }
      }
    }

    // Update status
    targetUser.isActive = isActive;
    targetUser.updatedBy = req.user._id;
    await targetUser.save();

    // Populate and return updated user
    await targetUser.populate('organization', 'name slug');
    const userResponse = targetUser.toObject();
    delete userResponse.password;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user
router.delete('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role: userRole, organization: userOrg } = req.user;

    // Find the target user
    const targetUser = await User.findById(userId).populate('organization');
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user can manage target user
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      SUPERADMIN: ['ADMIN', 'ORGADMIN', 'USER'],
      ADMIN: ['ORGADMIN', 'USER'],
      ORGADMIN: ['USER'],
      USER: [],
    };

    if (!roleHierarchy[userRole]?.includes(targetUser.role)) {
      return res.status(403).json({ error: 'Cannot delete this user' });
    }

    // Check organization access
    if (userRole === 'ORGADMIN') {
      if (!userOrg || !targetUser.organization || 
          userOrg._id.toString() !== targetUser.organization._id.toString()) {
        return res.status(403).json({ error: 'Cannot delete user from different organization' });
      }
    } else if (userRole === 'ADMIN') {
      if (targetUser.organization) {
        const org = await Organization.findById(targetUser.organization._id);
        if (!org || org.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: 'Cannot delete user from this organization' });
        }
      }
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;