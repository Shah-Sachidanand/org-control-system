import express, { Response } from 'express';
import Feature from '../models/Feature';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get all features
router.get('/', authenticate, async (req: any, res: Response) => {
  try {
    const features = await Feature.find();
    res.json({ features });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create feature (SUPERADMIN only)
router.post('/', authenticate, authorize('SUPERADMIN'), async (req: any, res: Response) => {
  try {
    const feature = new Feature(req.body);
    await feature.save();
    res.status(201).json({ feature });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update feature (SUPERADMIN only)
router.put('/:id', authenticate, authorize('SUPERADMIN'), async (req: any, res: Response) => {
  try {
    const feature = await Feature.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }
    res.json({ feature });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;