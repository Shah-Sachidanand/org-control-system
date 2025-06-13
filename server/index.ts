import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import organizationRoutes from './routes/organizations';
import userRoutes from './routes/users';
import featureRoutes from './routes/features';
import permissionRoutes from './routes/permissions';
import { initializeData } from './seedData';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/org-access-control')
  .then(async () => {
    console.log('MongoDB connected');
    // Initialize seed data
    await initializeData();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/permissions', permissionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});