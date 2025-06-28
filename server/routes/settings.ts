import express, { Request, Response } from 'express';
import User from '../models/User';
import Organization from '../models/Organization';
import { authenticate, authorize } from '../middleware/auth';
import { IUserSettings, IOrganizationSettings } from '../types';

const router = express.Router();

// Get user settings
router.get('/user', authenticate, async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id).select('settings');

        const defaultSettings = {
            notifications: {
                email: true,
                push: true,
                promotions: true,
                invitations: true,
                system: true
            },
            privacy: {
                profileVisible: true,
                activityVisible: false
            },
            preferences: {
                theme: 'light',
                language: 'en',
                timezone: 'UTC'
            }
        };

        res.json({ settings: user?.settings || defaultSettings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update user settings
router.put('/user', authenticate, async (req: Request<{}, {}, IUserSettings>, res: Response) => {
    try {
        const currentUser = (req as any).user;

        const user = await User.findByIdAndUpdate(
            currentUser._id,
            { settings: req.body },
            { new: true }
        ).select('settings');

        res.json({ settings: user?.settings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get organization settings
router.get('/organization/:orgId', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), async (req: any, res: Response) => {
    try {
        const { orgId } = req.params;
        const currentUser = req.user;

        // Check permissions
        if (currentUser.role === 'ORGADMIN' &&
            (!currentUser.organization || currentUser.organization._id.toString() !== orgId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const organization = await Organization.findById(orgId).select('settings');

        res.json({ settings: organization?.settings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update organization settings
router.put('/organization/:orgId', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), async (req: Request<{ orgId: string }, {}, IOrganizationSettings>, res: Response) => {
    try {
        const { orgId } = req.params;
        const currentUser = (req as any).user;

        // Check permissions
        if (currentUser.role === 'ORGADMIN' &&
            (!currentUser.organization || currentUser.organization._id.toString() !== orgId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const organization = await Organization.findByIdAndUpdate(
            orgId,
            { settings: req.body },
            { new: true }
        ).select('settings');

        res.json({ settings: organization?.settings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;