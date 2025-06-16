import express, { Request, Response } from 'express';
import Partner from '../models/Partner';
import { authenticate, authorize } from '../middleware/auth';
import { CreatePartnerRequest, UpdatePartnerRequest } from '../types';

const router = express.Router();

// Get all partners for organization
router.get('/organization/:orgId', authenticate, async (req: any, res: Response) => {
    try {
        const { orgId } = req.params;
        const currentUser = req.user;

        // Check permissions
        if (currentUser.role !== 'SUPERADMIN' &&
            currentUser.role !== 'ADMIN' &&
            (!currentUser.organization || currentUser.organization._id.toString() !== orgId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const partners = await Partner.find({ organizationId: orgId })
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name')
            .sort({ isDefault: -1, createdAt: -1 });

        res.json({ partners });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create partner
router.post('/', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), async (req: Request<{}, {}, CreatePartnerRequest>, res: Response) => {
    try {
        const currentUser = (req as any).user;

        const partner = new Partner({
            ...req.body,
            organizationId: req.body.organizationId || currentUser.organization._id,
            createdBy: currentUser._id
        });

        await partner.save();

        const populatedPartner = await Partner.findById(partner._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name');

        res.status(201).json({ partner: populatedPartner });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update partner
router.put('/:id', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), async (req: Request<{ id: string }, {}, UpdatePartnerRequest>, res: Response) => {
    try {
        const currentUser = (req as any).user;

        const partner = await Partner.findById(req.params.id);
        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        // Check organization access
        if (currentUser.role !== 'SUPERADMIN' &&
            partner.organizationId.toString() !== currentUser.organization._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        Object.assign(partner, req.body);
        partner.updatedBy = currentUser._id;
        await partner.save();

        const updatedPartner = await Partner.findById(partner._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('organizationId', 'name');

        res.json({ partner: updatedPartner });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete partner
router.delete('/:id', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), async (req: any, res: Response) => {
    try {
        const currentUser = req.user;

        const partner = await Partner.findById(req.params.id);
        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        // Check if it's default partner
        if (partner.isDefault) {
            return res.status(400).json({ error: 'Cannot delete default partner' });
        }

        // Check organization access
        if (currentUser.role !== 'SUPERADMIN' &&
            partner.organizationId.toString() !== currentUser.organization._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Partner.findByIdAndDelete(req.params.id);
        res.json({ message: 'Partner deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;