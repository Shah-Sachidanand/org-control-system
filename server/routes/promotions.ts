import express, { Request, Response } from 'express';
import Promotion from '../models/Promotion';
import { authenticate, checkFeatureAccess } from '../middleware/auth';
import { CreatePromotionRequest, UpdatePromotionRequest } from '../types';

const router = express.Router();

// Get all promotions for organization
router.get('/', authenticate, checkFeatureAccess('promotion', 'read'), async (req: any, res: Response) => {
    try {
        const currentUser = req.user;
        const { type, status } = req.query;

        const filter: any = {};

        if (currentUser.role !== 'SUPERADMIN') {
            filter.organizationId = currentUser.organization?._id;
        }

        if (type) filter.type = type;
        if (status) filter.status = status;

        const promotions = await Promotion.find(filter)
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name')
            .sort({ createdAt: -1 });

        res.json({ promotions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get promotion by ID
router.get('/:id', authenticate, checkFeatureAccess('promotion', 'read'), async (req: any, res: Response) => {
    try {
        const promotion = await Promotion.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name');

        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        // Check organization access
        const currentUser = req.user;
        if (currentUser.role !== 'SUPERADMIN' &&
            promotion?.organizationId !== currentUser?.organization?._id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ promotion });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create promotion
router.post('/', authenticate, checkFeatureAccess('promotion', 'write'), async (req: Request<{}, {}, CreatePromotionRequest>, res: Response) => {
    try {
        const currentUser = (req as any).user;

        const promotion = new Promotion({
            ...req.body,
            organizationId: currentUser.organization._id,
            createdBy: currentUser._id
        });

        await promotion.save();

        const populatedPromotion = await Promotion.findById(promotion._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name');

        res.status(201).json({ promotion: populatedPromotion });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update promotion
router.put('/:id', authenticate, checkFeatureAccess('promotion', 'write'), async (req: Request<{ id: string }, {}, UpdatePromotionRequest>, res: Response) => {
    try {
        const currentUser = (req as any).user;

        const promotion = await Promotion.findById(req.params.id);
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        // Check organization access
        if (currentUser.role !== 'SUPERADMIN' &&
            promotion.organizationId.toString() !== currentUser.organization._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        Object.assign(promotion, req.body);
        promotion.updatedBy = currentUser._id;
        await promotion.save();

        const updatedPromotion = await Promotion.findById(promotion._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name');

        res.json({ promotion: updatedPromotion });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete promotion
router.delete('/:id', authenticate, checkFeatureAccess('promotion', 'delete'), async (req: any, res: Response) => {
    try {
        const currentUser = req.user;

        const promotion = await Promotion.findById(req.params.id);
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        // Check organization access
        if (currentUser.role !== 'SUPERADMIN' &&
            promotion.organizationId.toString() !== currentUser.organization._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Promotion.findByIdAndDelete(req.params.id);
        res.json({ message: 'Promotion deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get promotion analytics
router.get('/:id/analytics', authenticate, checkFeatureAccess('promotion', 'read'), async (req: any, res: Response) => {
    try {
        const promotion = await Promotion.findById(req.params.id);
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        // Mock analytics data
        const analytics = {
            views: Math.floor(Math.random() * 10000),
            clicks: Math.floor(Math.random() * 1000),
            conversions: Math.floor(Math.random() * 100),
            revenue: Math.floor(Math.random() * 50000),
            clickThroughRate: (Math.random() * 10).toFixed(2),
            conversionRate: (Math.random() * 5).toFixed(2)
        };

        res.json({ analytics });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;