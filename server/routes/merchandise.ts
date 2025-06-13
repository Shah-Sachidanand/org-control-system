import express, { Request, Response } from 'express';
import Merchandise from '../models/Merchandise';
import { authenticate, checkFeatureAccess } from '../middleware/auth';
import { CreateMerchandiseRequest, UpdateMerchandiseRequest } from '../types/index';

const router = express.Router();

// Get all merchandise for organization
router.get('/', authenticate, checkFeatureAccess('merchandise', 'read'), async (req: any, res: Response) => {
    try {
        const currentUser = req.user;
        const { type, status, category } = req.query;

        const filter: any = {};

        if (currentUser.role !== 'SUPERADMIN') {
            filter.organizationId = currentUser.organization._id;
        }

        if (type) filter.type = type;
        if (status) filter.status = status;
        if (category) filter.category = category;

        const merchandise = await Merchandise.find(filter)
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name')
            .sort({ createdAt: -1 });

        res.json({ merchandise });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get merchandise by ID
router.get('/:id', authenticate, checkFeatureAccess('merchandise', 'read'), async (req: any, res: Response) => {
    try {
        const merchandise = await Merchandise.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name');

        if (!merchandise) {
            return res.status(404).json({ error: 'Merchandise not found' });
        }

        // Check organization access
        const currentUser = req.user;
        if (currentUser.role !== 'SUPERADMIN' &&
            merchandise.organizationId !== currentUser.organization._id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ merchandise });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create merchandise
router.post('/', authenticate, checkFeatureAccess('merchandise', 'write'), async (req: Request<{}, {}, CreateMerchandiseRequest>, res: Response) => {
    try {
        const currentUser = (req as any).user;

        const merchandise = new Merchandise({
            ...req.body,
            organizationId: currentUser.organization._id,
            createdBy: currentUser._id
        });

        await merchandise.save();

        const populatedMerchandise = await Merchandise.findById(merchandise._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name');

        res.status(201).json({ merchandise: populatedMerchandise });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update merchandise
router.put('/:id', authenticate, checkFeatureAccess('merchandise', 'write'), async (req: Request<{ id: string }, {}, UpdateMerchandiseRequest>, res: Response) => {
    try {
        const currentUser = (req as any).user;

        const merchandise = await Merchandise.findById(req.params.id);
        if (!merchandise) {
            return res.status(404).json({ error: 'Merchandise not found' });
        }

        // Check organization access
        if (currentUser.role !== 'SUPERADMIN' &&
            merchandise.organizationId.toString() !== currentUser.organization._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        Object.assign(merchandise, req.body);
        merchandise.updatedBy = currentUser._id;
        await merchandise.save();

        const updatedMerchandise = await Merchandise.findById(merchandise._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name');

        res.json({ merchandise: updatedMerchandise });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete merchandise
router.delete('/:id', authenticate, checkFeatureAccess('merchandise', 'delete'), async (req: any, res: Response) => {
    try {
        const currentUser = req.user;

        const merchandise = await Merchandise.findById(req.params.id);
        if (!merchandise) {
            return res.status(404).json({ error: 'Merchandise not found' });
        }

        // Check organization access
        if (currentUser.role !== 'SUPERADMIN' &&
            merchandise.organizationId.toString() !== currentUser.organization._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Merchandise.findByIdAndDelete(req.params.id);
        res.json({ message: 'Merchandise deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update stock
router.patch('/:id/stock', authenticate, checkFeatureAccess('merchandise', 'write'), async (req: any, res: Response) => {
    try {
        const { quantity, operation } = req.body; // operation: 'add' | 'subtract' | 'set'

        const merchandise = await Merchandise.findById(req.params.id);
        if (!merchandise) {
            return res.status(404).json({ error: 'Merchandise not found' });
        }

        switch (operation) {
            case 'add':
                merchandise.inventory.quantity += quantity;
                break;
            case 'subtract':
                merchandise.inventory.quantity = Math.max(0, merchandise.inventory.quantity - quantity);
                break;
            case 'set':
                merchandise.inventory.quantity = quantity;
                break;
            default:
                return res.status(400).json({ error: 'Invalid operation' });
        }

        merchandise.updatedBy = req.user._id;
        await merchandise.save();

        res.json({ merchandise });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;