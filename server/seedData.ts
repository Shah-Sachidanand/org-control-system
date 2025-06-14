import mongoose from 'mongoose';
import Feature from './models/Feature';
import User from './models/User';
import Organization from './models/Organization';
import dotenv from 'dotenv';

dotenv.config();

// Seed initial features
export const seedFeatures = async () => {
  try {
    const existingFeatures = await Feature.countDocuments();
    if (existingFeatures > 0) return;

    const features = [
      {
        name: 'promotion',
        displayName: 'Promotion Management',
        description: 'Manage promotional campaigns and offers',
        subFeatures: [
          {
            name: 'email',
            displayName: 'Email Promotions',
            description: 'Email-based promotional campaigns',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'unique_code',
            displayName: 'Unique Code Promotions',
            description: 'Unique code-based promotions',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'qr_code',
            displayName: 'QR Code Promotions',
            description: 'QR code-based promotions',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'video',
            displayName: 'Video Promotions',
            description: 'Video-based promotional content',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'joining_bonus',
            displayName: 'Joining Bonus',
            description: 'New member joining bonuses',
            actions: ['read', 'write', 'delete', 'manage']
          }
        ],
        requiredRole: 'ORGADMIN',
        status: 'done'
      },
      {
        name: 'merchandise',
        displayName: 'Merchandise Management',
        description: 'Manage merchandise and rewards',
        subFeatures: [
          {
            name: 'experience',
            displayName: 'Experience Rewards',
            description: 'Experience-based merchandise',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'loaded_value',
            displayName: 'Loaded Value',
            description: 'Value-loaded merchandise',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'autograph',
            displayName: 'Autograph Items',
            description: 'Autographed merchandise',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'merch_level',
            displayName: 'Merchandise Level',
            description: 'Tiered merchandise levels',
            actions: ['read', 'write', 'delete', 'manage']
          }
        ],
        requiredRole: 'ORGADMIN',
        status: 'done'
      },
      {
        name: 'user_management',
        displayName: 'User Management',
        description: 'Manage users and permissions',
        subFeatures: [
          {
            name: 'view_users',
            displayName: 'View Users',
            description: 'View user listings',
            actions: ['read']
          },
          {
            name: 'manage_users',
            displayName: 'Manage Users',
            description: 'Create, update, delete users',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'manage_permissions',
            displayName: 'Manage Permissions',
            description: 'Assign and modify user permissions',
            actions: ['read', 'write', 'manage']
          }
        ],
        requiredRole: 'ORGADMIN',
        status: 'done'
      },
      {
        name: 'organization_management',
        displayName: 'Organization Management',
        description: 'Manage organizations and settings',
        subFeatures: [
          {
            name: 'view_organizations',
            displayName: 'View Organizations',
            description: 'View organization listings',
            actions: ['read']
          },
          {
            name: 'manage_organizations',
            displayName: 'Manage Organizations',
            description: 'Create, update, delete organizations',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'manage_features',
            displayName: 'Manage Features',
            description: 'Enable/disable organization features',
            actions: ['read', 'write', 'manage']
          }
        ],
        requiredRole: 'ADMIN',
        status: 'done'
      }
    ];

    await Feature.insertMany(features);
    console.log('Features seeded successfully');
  } catch (error) {
    console.error('Error seeding features:', error);
  }
};

// Create super admin user
export const createSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'SUPERADMIN' });
    if (existingSuperAdmin) return;

    // Assuming you already have loaded all features:
    const features = await Feature.find(); // includes 'promotion', 'merchandise', etc.

    const permissions = features.map((feature) => ({
      feature: feature.name, // ✅ REQUIRED
      subFeatures: feature.subFeatures.map(sub => sub.name), // optional, based on your logic
      actions: ['read', 'write', 'delete'] // or fetch from feature.subFeatures[i].actions
    }));

    const superAdmin = new User({
      email: 'superadmin@system.com',
      password: 'SuperAdmin123!',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPERADMIN',
      permissions: permissions
    });

    await superAdmin.save();
    console.log('Super admin created successfully');
    console.log('Login credentials: superadmin@system.com / SuperAdmin123!');
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
};

// Create demo organization and users
export const createDemoData = async () => {
  try {
    const existingOrg = await Organization.findOne({ slug: 'demo-org' });
    if (existingOrg) {
      console.log('Demo organization already exists. Skipping demo data creation.');
      return;
    }

    // ✅ Ensure SUPERADMIN exists
    let superAdmin = await User.findOne({ role: 'SUPERADMIN' });

    if (!superAdmin) {
      superAdmin = await User.create({
        email: 'superadmin@system.com',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPERADMIN'
      });

      console.log('SuperAdmin created: superadmin@system.com / SuperAdmin123!');
    }

    // ✅ Create demo admin
    const demoAdmin = await User.create({
      email: 'admin@demo.com',
      password: 'Admin123!',
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'ADMIN',
      permissions: [],
      createdBy: superAdmin._id
    });


    // ✅ Create demo organization
    const demoOrg = await Organization.create({
      name: 'Demo Organization',
      slug: 'demo-org',
      description: 'Demo organization for testing',
      features: [
        {
          name: 'promotion',
          isEnabled: true,
          subFeatures: [
            { name: 'email', isEnabled: true },
            { name: 'unique_code', isEnabled: true },
            { name: 'qr_code', isEnabled: false },
            { name: 'video', isEnabled: true },
            { name: 'joining_bonus', isEnabled: true }
          ]
        },
        {
          name: 'merchandise',
          isEnabled: true,
          subFeatures: [
            { name: 'experience', isEnabled: true },
            { name: 'loaded_value', isEnabled: true },
            { name: 'autograph', isEnabled: false },
            { name: 'merch_level', isEnabled: true }
          ]
        }
      ],
      createdBy: demoAdmin._id
    });

    console.log('Demo organization created successfully:', demoOrg.name);

    // ✅ Create demo org admin
    const demoOrgAdmin = await User.create({
      email: 'orgadmin@demo.com',
      password: 'OrgAdmin123!',
      firstName: 'Org',
      lastName: 'Admin',
      role: 'ORGADMIN',
      organization: demoOrg._id,
      permissions: [
        {
          feature: 'promotion',
          subFeatures: ['email', 'unique_code', 'video', 'joining_bonus'],
          actions: ['read', 'write', 'manage']
        },
        {
          feature: 'merchandise',
          subFeatures: ['experience', 'loaded_value', 'merch_level'],
          actions: ['read', 'write', 'manage']
        },
        {
          feature: 'user_management',
          subFeatures: ['view_users', 'manage_users', 'manage_permissions'],
          actions: ['read', 'write', 'manage']
        }
      ],
      createdBy: demoAdmin._id
    });

    await User.create({
      email: 'user@demo.com',
      password: 'User123!',
      firstName: 'Demo',
      lastName: 'User',
      role: 'USER',
      organization: demoOrg._id,
      permissions: [
        {
          feature: 'promotion',
          subFeatures: ['email', 'unique_code'],
          actions: ['read']
        },
        {
          feature: 'merchandise',
          subFeatures: ['experience'],
          actions: ['read']
        }
      ],
      createdBy: demoOrgAdmin._id
    });

    // ✅ Logs
    console.log('Demo data created successfully');
    console.log('Demo credentials:');
    console.log('- Admin: admin@demo.com / Admin123!');
    console.log('- Org Admin: orgadmin@demo.com / OrgAdmin123!');
    console.log('- User: user@demo.com / User123!');
  } catch (error) {
    console.error('Error creating demo data:', error);
  }
};

// Initialize seed data
export const initializeData = async () => {
  await seedFeatures();
  await createSuperAdmin();
  await createDemoData();
};

// Run seeding if called directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/org-access-control')
    .then(async () => {
      console.log('MongoDB connected for seeding');
      await initializeData();
      process.exit(0);
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}