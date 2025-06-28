import express, { Request, Response } from 'express';
import Notification from '../models/Notification';
import { authenticate } from '../middleware/auth';
import { CreateNotificationRequest } from '../types';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, async (req: any, res: Response) => {
    try {
        const currentUser = req.user;
        const { status, type, limit = 50 } = req.query;

        const filter: any = { userId: currentUser._id };
        if (status) filter.status = status;
        if (type) filter.type = type;

        const notifications = await Notification.find(filter)
            .populate('organizationId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string));

        res.json({ notifications });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: any, res: Response) => {
    try {
        const currentUser = req.user;

        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: currentUser._id
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        notification.status = 'read';
        notification.readAt = new Date();
        await notification.save();

        res.json({ notification });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, async (req: any, res: Response) => {
    try {
        const currentUser = req.user;

        await Notification.updateMany(
            { userId: currentUser._id, status: 'unread' },
            { status: 'read', readAt: new Date() }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create notification (system use)
router.post('/', authenticate, async (req: Request<{}, {}, CreateNotificationRequest>, res: Response) => {
    try {
        const notification = new Notification(req.body);
        await notification.save();

        const populatedNotification = await Notification.findById(notification._id)
            .populate('organizationId', 'name');

        res.status(201).json({ notification: populatedNotification });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get unread count
router.get('/unread-count', authenticate, async (req: any, res: Response) => {
    try {
        const currentUser = req.user;

        const count = await Notification.countDocuments({
            userId: currentUser._id,
            status: 'unread'
        });

        res.json({ count });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;