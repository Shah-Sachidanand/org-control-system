import express, { Request, Response } from 'express';
import Organization from '../models/Organization';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();

// Get all organizations (ADMIN and SUPERADMIN only)
router.get('/', authenticate, authorize('ADMIN', 'SUPERADMIN'), async (req: Request, res: Response) => {
  try {
    const organizations = await Organization.find()
      .populate('createdBy', 'firstName lastName email');

    res.json({ organizations });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Create organization
router.post('/', authenticate, authorize('ADMIN', 'SUPERADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, features } = req.body;

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const organization = new Organization({
      name,
      slug,
      description,
      features: features ?? [],
      createdBy: req?.user?._id
    });

    await organization.save();

    const populatedOrg = await Organization.findById(organization._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({ organization: populatedOrg });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Get organization by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if user has access to this organization
    if (req?.user?.role !== 'SUPERADMIN' && req?.user?.role !== 'ADMIN') {
      if (!req?.user?.organization || req?.user?.organization?._id !== req.params.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ organization });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Update organization features
router.put('/:id/features', authenticate, authorize('ORGADMIN', 'ADMIN', 'SUPERADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { features } = req.body;

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check permissions
    if (req?.user?.role === 'ORGADMIN') {
      if (!req?.user?.organization || req?.user?.organization._id.toString() !== req.params.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    organization.features = features;
    await organization.save();

    res.json({ organization });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export default router;