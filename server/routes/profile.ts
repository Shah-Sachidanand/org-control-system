import express, { Request, Response } from 'express';
import User from '../models/User';
import { authenticate } from '../middleware/auth';
import { UpdateProfileRequest, ChangePasswordRequest } from '../types';

const router = express.Router();

// Get user profile
router.get('/', authenticate, async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('organization', 'name slug')
            .select('-password');

        res.json({ user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update profile
router.put('/', authenticate, async (req: Request<{}, {}, UpdateProfileRequest>, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const { firstName, lastName, email } = req.body;

        // Check if email is already taken by another user
        if (email && email !== currentUser.email) {
            const existingUser = await User.findOne({
                email,
                _id: { $ne: currentUser._id }
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        const user = await User.findByIdAndUpdate(
            currentUser._id,
            { firstName, lastName, email },
            { new: true }
        ).populate('organization', 'name slug').select('-password');

        res.json({ user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Change password
router.put('/change-password', authenticate, async (req: Request<{}, {}, ChangePasswordRequest>, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(currentUser._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;