import express, { Request, Response } from 'express';
import User from '../models/User';
import Organization from '../models/Organization';
import Invitation from '../models/Invitation';
import { authenticate, authorize } from '../middleware/auth';
import { sendInvitationEmail } from '../utils/email';
import { InviteUserRequest } from '../types';

const router = express.Router();

// Send invitation
router.post('/send', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), async (req: Request<{}, {}, InviteUserRequest>, res: Response) => {
    try {
        const { email, role, organizationId, permissions } = req.body;
        const currentUser = (req as any).user;

        // Check if user can invite to this organization
        if (currentUser.role === 'ORGADMIN' && currentUser.organization._id.toString() !== organizationId) {
            return res.status(403).json({ error: 'Cannot invite to different organization' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Check if invitation already exists
        const existingInvitation = await Invitation.findOne({
            email,
            organizationId,
            status: 'pending'
        });
        if (existingInvitation) {
            return res.status(400).json({ error: 'Invitation already sent' });
        }

        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        const invitation = new Invitation({
            email,
            role,
            organizationId,
            permissions: permissions || [],
            invitedBy: currentUser._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        await invitation.save();

        res.status(201).json({
            message: 'Invitation sent successfully',
            invitation: {
                ...invitation.toObject(),
                invitationLink: `${process.env.FRONTEND_URL}/accept-invitation/${invitation.token}`
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Send admin invitation (SUPERADMIN only)
router.post('/send-admin', authenticate, authorize('SUPERADMIN'), async (req: any, res: Response) => {
    try {
        const { email, firstName, lastName, permissions } = req.body;
        const currentUser = req.user;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Check if invitation already exists
        const existingInvitation = await Invitation.findOne({
            email,
            role: 'ADMIN',
            status: 'pending'
        });
        if (existingInvitation) {
            return res.status(400).json({ error: 'Admin invitation already sent' });
        }

        const invitation = new Invitation({
            email,
            role: 'ADMIN',
            organizationId: null, // Admin doesn't belong to specific org
            permissions: permissions || [],
            invitedBy: currentUser._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            firstName,
            lastName
        });

        await invitation.save();

        res.status(201).json({
            message: 'Admin invitation sent successfully',
            invitation: {
                ...invitation.toObject(),
                invitationLink: `${process.env.FRONTEND_URL}/accept-invitation/${invitation.token}`
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get invitations for organization
router.get('/organization/:orgId', authenticate, async (req: any, res: Response) => {
    try {
        const { orgId } = req.params;
        const currentUser = req.user;

        // Check permissions
        if (currentUser.role === 'ORGADMIN' && currentUser.organization._id.toString() !== orgId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const invitations = await Invitation.find({ organizationId: orgId })
            .populate('invitedBy', 'firstName lastName email')
            .populate('organizationId', 'name')
            .sort({ createdAt: -1 });

        res.json({ invitations });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get admin invitations (SUPERADMIN only)
router.get('/admin', authenticate, authorize('SUPERADMIN'), async (req: any, res: Response) => {
    try {
        const invitations = await Invitation.find({
            role: 'ADMIN',
            organizationId: null
        })
            .populate('invitedBy', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json({ invitations });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Accept invitation
router.post('/accept/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password, firstName, lastName } = req.body;

        const invitation = await Invitation.findOne({
            token,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        }).populate('organizationId');

        if (!invitation) {
            return res.status(400).json({ error: 'Invalid or expired invitation' });
        }

        // Create user
        const userData: any = {
            email: invitation.email,
            password,
            firstName: firstName ?? invitation.firstName,
            lastName: lastName ?? invitation.lastName,
            role: invitation.role,
            permissions: invitation.permissions,
            createdBy: invitation.invitedBy
        };

        // Only set organization for non-admin roles
        if (invitation.role !== 'ADMIN' && invitation.organizationId) {
            userData.organization = invitation.organizationId;
        }

        const user = new User(userData);
        await user.save();

        // Update invitation status
        invitation.status = 'accepted';
        invitation.acceptedAt = new Date();
        await invitation.save();

        res.status(201).json({
            message: 'Invitation accepted successfully',
            user: {
                ...user.toObject(),
                password: undefined
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Resend invitation
router.post('/resend/:id', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), async (req: any, res: Response) => {
    try {
        const invitation = await Invitation.findById(req.params.id);
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        // Update expiry
        invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await invitation.save();

        res.json({ message: 'Invitation resent successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;