import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate } from '../middleware/auth';
import { LoginRequest, RegisterRequest } from '../types';

const router = express.Router();

// Register
router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { email, password, firstName, lastName, organizationId, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userData: any = {
      email,
      password,
      firstName,
      lastName,
      role: role || 'USER'
    };

    if (organizationId) {
      userData.organization = organizationId;
    }

    const user = new User(userData);
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const userResponse = await User.findById(user._id)
      .populate('organization')
      .select('-password');

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('organization');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const userResponse = { ...user.toObject(), password: user.toObject().password as string | undefined };
    delete userResponse.password;

    res.json({
      token,
      user: userResponse
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('organization')
      .select('-password');

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;