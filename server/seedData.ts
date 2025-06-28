import mongoose from 'mongoose';
import Feature from './models/Feature';
import User from './models/User';
import Organization from './models/Organization';
import Partner from './models/Partner';
import Promotion from './models/Promotion';
import Merchandise from './models/Merchandise';
import Notification from './models/Notification';
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
        featureLevel: 'ORGANIZATION',
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
        featureLevel: 'ORGANIZATION',
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
        featureLevel: 'ORGANIZATION',
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
        featureLevel: 'USER_ROLE',
        status: 'done'
      },
      {
        name: 'partner_management',
        displayName: 'Partner Management',
        description: 'Manage sponsorship partners',
        subFeatures: [
          {
            name: 'view_partners',
            displayName: 'View Partners',
            description: 'View partner listings',
            actions: ['read']
          },
          {
            name: 'manage_partners',
            displayName: 'Manage Partners',
            description: 'Create, update, delete partners',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'payment_processing',
            displayName: 'Payment Processing',
            description: 'Process sponsorship payments',
            actions: ['read', 'write', 'manage']
          }
        ],
        requiredRole: 'ORGADMIN',
        featureLevel: 'ORGANIZATION',
        status: 'done'
      },
      {
        name: 'system_management',
        displayName: 'System Management',
        description: 'System-wide management features',
        subFeatures: [
          {
            name: 'feature_management',
            displayName: 'Feature Management',
            description: 'Manage system features',
            actions: ['read', 'write', 'delete', 'manage']
          },
          {
            name: 'platform_settings',
            displayName: 'Platform Settings',
            description: 'Configure platform settings',
            actions: ['read', 'write', 'manage']
          }
        ],
        requiredRole: 'SUPERADMIN',
        featureLevel: 'SYSTEM',
        status: 'done'
      }
    ];

    await Feature.insertMany(features);
    console.log('✅ Features seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding features:', error);
  }
};

// Create super admin user
export const createSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'SUPERADMIN' });
    if (existingSuperAdmin) return;

    const features = await Feature.find();
    const permissions = features.map((feature) => ({
      feature: feature.name,
      subFeatures: feature.subFeatures.map(sub => sub.name),
      actions: ['read', 'write', 'delete', 'manage']
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
    console.log('✅ Super admin created: superadmin@system.com / SuperAdmin123!');
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  }
};

// Create comprehensive demo data
export const createDemoData = async () => {
  try {
    const existingOrg = await Organization.findOne({ slug: 'demo-org' });
    if (existingOrg) {
      console.log('Demo data already exists. Skipping demo data creation.');
      return;
    }

    let superAdmin = await User.findOne({ role: 'SUPERADMIN' });
    if (!superAdmin) {
      await createSuperAdmin();
      superAdmin = await User.findOne({ role: 'SUPERADMIN' });
    }

    // Create multiple demo admins
    const demoAdmin1 = await User.create({
      email: 'admin1@demo.com',
      password: 'Admin123!',
      firstName: 'John',
      lastName: 'Admin',
      role: 'ADMIN',
      permissions: [
        {
          feature: 'organization_management',
          subFeatures: ['view_organizations', 'manage_organizations', 'manage_features'],
          actions: ['read', 'write', 'manage']
        }
      ],
      createdBy: superAdmin?._id
    });

    const demoAdmin2 = await User.create({
      email: 'admin2@demo.com',
      password: 'Admin123!',
      firstName: 'Sarah',
      lastName: 'Manager',
      role: 'ADMIN',
      permissions: [
        {
          feature: 'organization_management',
          subFeatures: ['view_organizations', 'manage_organizations', 'manage_features'],
          actions: ['read', 'write', 'manage']
        }
      ],
      createdBy: superAdmin?._id
    });

    // Create multiple demo organizations
    const organizations = [
      {
        name: 'TechCorp Solutions',
        slug: 'techcorp-solutions',
        description: 'Leading technology solutions provider',
        createdBy: demoAdmin1._id,
        features: [
          {
            name: 'promotion',
            isEnabled: true,
            subFeatures: [
              { name: 'email', isEnabled: true },
              { name: 'unique_code', isEnabled: true },
              { name: 'qr_code', isEnabled: true },
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
          },
          {
            name: 'user_management',
            isEnabled: true,
            subFeatures: [
              { name: 'view_users', isEnabled: true },
              { name: 'manage_users', isEnabled: true },
              { name: 'manage_permissions', isEnabled: true }
            ]
          },
          {
            name: 'partner_management',
            isEnabled: true,
            subFeatures: [
              { name: 'view_partners', isEnabled: true },
              { name: 'manage_partners', isEnabled: true },
              { name: 'payment_processing', isEnabled: true }
            ]
          }
        ]
      },
      {
        name: 'Global Marketing Hub',
        slug: 'global-marketing-hub',
        description: 'International marketing and advertising agency',
        createdBy: demoAdmin1._id,
        features: [
          {
            name: 'promotion',
            isEnabled: true,
            subFeatures: [
              { name: 'email', isEnabled: true },
              { name: 'unique_code', isEnabled: true },
              { name: 'qr_code', isEnabled: false },
              { name: 'video', isEnabled: true },
              { name: 'joining_bonus', isEnabled: false }
            ]
          },
          {
            name: 'merchandise',
            isEnabled: false,
            subFeatures: []
          },
          {
            name: 'user_management',
            isEnabled: true,
            subFeatures: [
              { name: 'view_users', isEnabled: true },
              { name: 'manage_users', isEnabled: true },
              { name: 'manage_permissions', isEnabled: false }
            ]
          },
          {
            name: 'partner_management',
            isEnabled: true,
            subFeatures: [
              { name: 'view_partners', isEnabled: true },
              { name: 'manage_partners', isEnabled: true },
              { name: 'payment_processing', isEnabled: false }
            ]
          }
        ]
      },
      {
        name: 'Sports Entertainment Co',
        slug: 'sports-entertainment-co',
        description: 'Sports and entertainment management company',
        createdBy: demoAdmin2._id,
        features: [
          {
            name: 'promotion',
            isEnabled: true,
            subFeatures: [
              { name: 'email', isEnabled: true },
              { name: 'unique_code', isEnabled: true },
              { name: 'qr_code', isEnabled: true },
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
              { name: 'autograph', isEnabled: true },
              { name: 'merch_level', isEnabled: true }
            ]
          },
          {
            name: 'user_management',
            isEnabled: true,
            subFeatures: [
              { name: 'view_users', isEnabled: true },
              { name: 'manage_users', isEnabled: true },
              { name: 'manage_permissions', isEnabled: true }
            ]
          },
          {
            name: 'partner_management',
            isEnabled: true,
            subFeatures: [
              { name: 'view_partners', isEnabled: true },
              { name: 'manage_partners', isEnabled: true },
              { name: 'payment_processing', isEnabled: true }
            ]
          }
        ]
      }
    ];

    const createdOrgs = await Organization.insertMany(organizations);
    console.log('✅ Demo organizations created');

    // Create ORGADMINs for each organization
    const orgAdmins = [];
    for (let i = 0; i < createdOrgs.length; i++) {
      const org = createdOrgs[i];
      const orgAdmin = await User.create({
        email: `orgadmin${i + 1}@${org.slug}.com`,
        password: 'OrgAdmin123!',
        firstName: ['Michael', 'Emma', 'David'][i],
        lastName: ['Johnson', 'Wilson', 'Brown'][i],
        role: 'ORGADMIN',
        organization: org._id,
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
          },
          {
            feature: 'partner_management',
            subFeatures: ['view_partners', 'manage_partners', 'payment_processing'],
            actions: ['read', 'write', 'manage']
          }
        ],
        createdBy: i < 2 ? demoAdmin1._id : demoAdmin2._id
      });
      orgAdmins.push(orgAdmin);
    }

    // Create multiple users for each organization
    const users = [];
    for (let i = 0; i < createdOrgs.length; i++) {
      const org = createdOrgs[i];
      const orgAdmin = orgAdmins[i];
      
      // Create 3-5 users per organization
      const userCount = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < userCount; j++) {
        const user = await User.create({
          email: `user${j + 1}@${org.slug}.com`,
          password: 'User123!',
          firstName: ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan'][j],
          lastName: ['Smith', 'Davis', 'Miller', 'Garcia', 'Rodriguez'][j],
          role: 'USER',
          organization: org._id,
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
          createdBy: orgAdmin._id
        });
        users.push(user);
      }
    }

    // Create partners for each organization
    for (let i = 0; i < createdOrgs.length; i++) {
      const org = createdOrgs[i];
      const orgAdmin = orgAdmins[i];

      // Create default partner
      await Partner.create({
        name: org.name,
        description: `Default partner for ${org.name}`,
        logo: `https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400`,
        website: `https://${org.slug}.com`,
        contactInfo: {
          email: `contact@${org.slug}.com`,
          phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          address: {
            street: `${Math.floor(Math.random() * 999) + 1} Business Ave`,
            city: ['New York', 'Los Angeles', 'Chicago'][i],
            state: ['NY', 'CA', 'IL'][i],
            country: 'USA',
            zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
          }
        },
        status: 'active',
        organizationId: org._id,
        isDefault: true,
        sponsorshipDetails: {
          budget: 0,
          currency: 'USD',
          contractStartDate: new Date(),
          contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          terms: 'Default organization partner',
          paymentStatus: 'paid'
        },
        createdBy: orgAdmin._id
      });

      // Create additional sponsor partners
      const sponsors = [
        {
          name: 'Microsoft Corporation',
          description: 'Technology partnership for cloud solutions',
          logo: 'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=400',
          website: 'https://microsoft.com',
          budget: 50000,
          paymentStatus: 'paid'
        },
        {
          name: 'Amazon Web Services',
          description: 'Cloud infrastructure and services partnership',
          logo: 'https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=400',
          website: 'https://aws.amazon.com',
          budget: 75000,
          paymentStatus: 'pending'
        },
        {
          name: 'Google Cloud Platform',
          description: 'AI and machine learning solutions partnership',
          logo: 'https://images.pexels.com/photos/4348403/pexels-photo-4348403.jpeg?auto=compress&cs=tinysrgb&w=400',
          website: 'https://cloud.google.com',
          budget: 60000,
          paymentStatus: 'paid'
        }
      ];

      for (let j = 0; j < Math.min(sponsors.length, 2 + Math.floor(Math.random() * 2)); j++) {
        const sponsor = sponsors[j];
        await Partner.create({
          name: sponsor.name,
          description: sponsor.description,
          logo: sponsor.logo,
          website: sponsor.website,
          contactInfo: {
            email: `partnership@${sponsor.name.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            address: {
              street: `${Math.floor(Math.random() * 999) + 1} Corporate Blvd`,
              city: ['Seattle', 'San Francisco', 'Austin'][j],
              state: ['WA', 'CA', 'TX'][j],
              country: 'USA',
              zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
            }
          },
          status: 'active',
          organizationId: org._id,
          isDefault: false,
          sponsorshipDetails: {
            budget: sponsor.budget,
            currency: 'USD',
            contractStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            contractEndDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
            terms: `Sponsorship agreement for ${sponsor.name} partnership`,
            paymentStatus: sponsor.paymentStatus,
            paymentAmount: sponsor.paymentStatus === 'paid' ? sponsor.budget : undefined,
            paidAt: sponsor.paymentStatus === 'paid' ? new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) : undefined
          },
          createdBy: orgAdmin._id
        });
      }
    }

    // Create promotional campaigns
    for (let i = 0; i < createdOrgs.length; i++) {
      const org = createdOrgs[i];
      const orgAdmin = orgAdmins[i];

      const campaigns = [
        {
          title: 'Summer Sale 2024',
          description: 'Biggest summer sale with up to 50% off on all products',
          type: 'email',
          status: 'active',
          content: {
            subject: 'Don\'t Miss Our Summer Sale!',
            body: 'Get ready for amazing discounts this summer. Shop now and save big!',
            imageUrl: 'https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&w=800',
            ctaText: 'Shop Now',
            ctaUrl: 'https://shop.example.com'
          },
          settings: {
            maxRedemptions: 1000,
            currentRedemptions: 245,
            discountType: 'percentage',
            discountValue: 25,
            minimumPurchase: 50
          }
        },
        {
          title: 'New Member Bonus',
          description: 'Welcome bonus for new members joining our platform',
          type: 'joining_bonus',
          status: 'active',
          content: {
            subject: 'Welcome to Our Community!',
            body: 'Thank you for joining us. Here\'s your welcome bonus!',
            imageUrl: 'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800',
            ctaText: 'Claim Bonus',
            ctaUrl: 'https://bonus.example.com'
          },
          settings: {
            maxRedemptions: 500,
            currentRedemptions: 89,
            discountType: 'fixed',
            discountValue: 20,
            minimumPurchase: 0
          }
        },
        {
          title: 'QR Code Special',
          description: 'Scan QR codes for instant discounts',
          type: 'qr_code',
          status: 'paused',
          content: {
            imageUrl: 'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=800',
            ctaText: 'Scan QR Code',
            ctaUrl: 'https://qr.example.com'
          },
          settings: {
            maxRedemptions: 200,
            currentRedemptions: 156,
            discountType: 'percentage',
            discountValue: 15,
            minimumPurchase: 25
          }
        }
      ];

      for (const campaign of campaigns) {
        await Promotion.create({
          ...campaign,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          targetAudience: {
            ageRange: { min: 18, max: 65 },
            location: ['USA', 'Canada'],
            interests: ['technology', 'shopping', 'deals']
          },
          organizationId: org._id,
          createdBy: orgAdmin._id
        });
      }
    }

    // Create merchandise items
    for (let i = 0; i < createdOrgs.length; i++) {
      const org = createdOrgs[i];
      const orgAdmin = orgAdmins[i];

      const merchandiseItems = [
        {
          name: 'VIP Event Experience',
          description: 'Exclusive access to VIP events and networking opportunities',
          type: 'experience',
          category: 'Events',
          pricing: { cost: 299.99, currency: 'USD', pointsRequired: 2500 },
          inventory: { quantity: 50, lowStockThreshold: 10, trackInventory: true },
          details: {
            images: ['https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800'],
            specifications: [
              { key: 'Duration', value: '3 hours' },
              { key: 'Includes', value: 'Networking, refreshments, exclusive content' }
            ]
          },
          redemption: {
            isRedeemable: true,
            redemptionInstructions: 'Present confirmation email at event entrance',
            expiryDays: 30,
            maxRedemptionsPerUser: 1
          }
        },
        {
          name: 'Premium Gift Card',
          description: 'Loaded value gift card for premium purchases',
          type: 'loaded_value',
          category: 'Gift Cards',
          pricing: { cost: 100.00, currency: 'USD', pointsRequired: 1000 },
          inventory: { quantity: 200, lowStockThreshold: 25, trackInventory: true },
          details: {
            images: ['https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=800'],
            specifications: [
              { key: 'Value', value: '$100 USD' },
              { key: 'Validity', value: '12 months' }
            ]
          },
          redemption: {
            isRedeemable: true,
            redemptionInstructions: 'Use code at checkout',
            expiryDays: 365,
            maxRedemptionsPerUser: 5
          }
        },
        {
          name: 'Signed Collectible Item',
          description: 'Limited edition signed merchandise from industry leaders',
          type: 'autograph',
          category: 'Collectibles',
          pricing: { cost: 499.99, currency: 'USD', pointsRequired: 5000 },
          inventory: { quantity: 25, lowStockThreshold: 5, trackInventory: true },
          details: {
            images: ['https://images.pexels.com/photos/4348403/pexels-photo-4348403.jpeg?auto=compress&cs=tinysrgb&w=800'],
            specifications: [
              { key: 'Authenticity', value: 'Certificate included' },
              { key: 'Edition', value: 'Limited to 100 pieces' }
            ]
          },
          redemption: {
            isRedeemable: true,
            redemptionInstructions: 'Ships within 5-7 business days',
            expiryDays: 90,
            maxRedemptionsPerUser: 1
          }
        },
        {
          name: 'Platinum Membership Level',
          description: 'Upgrade to platinum level with exclusive benefits',
          type: 'merch_level',
          category: 'Memberships',
          pricing: { cost: 199.99, currency: 'USD', pointsRequired: 2000 },
          inventory: { quantity: 100, lowStockThreshold: 20, trackInventory: true },
          details: {
            images: ['https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800'],
            specifications: [
              { key: 'Benefits', value: 'Priority support, exclusive content, early access' },
              { key: 'Duration', value: '12 months' }
            ]
          },
          redemption: {
            isRedeemable: true,
            redemptionInstructions: 'Membership activated immediately upon redemption',
            expiryDays: 365,
            maxRedemptionsPerUser: 1
          }
        }
      ];

      for (const item of merchandiseItems) {
        await Merchandise.create({
          ...item,
          status: 'active',
          organizationId: org._id,
          createdBy: orgAdmin._id
        });
      }
    }

    // Create notifications for users
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const notifications = [
        {
          title: 'Welcome to the Platform!',
          message: 'Thank you for joining our organization. Explore the features available to you.',
          type: 'info',
          status: 'unread',
          userId: user._id,
          organizationId: user.organization
        },
        {
          title: 'New Promotion Available',
          message: 'Check out our latest summer sale promotion with amazing discounts!',
          type: 'promotion',
          status: Math.random() > 0.5 ? 'unread' : 'read',
          userId: user._id,
          organizationId: user.organization,
          readAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined
        },
        {
          title: 'Merchandise Restocked',
          message: 'Your favorite items are back in stock. Don\'t miss out!',
          type: 'info',
          status: Math.random() > 0.3 ? 'read' : 'unread',
          userId: user._id,
          organizationId: user.organization,
          readAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000) : undefined
        }
      ];

      await Notification.insertMany(notifications);
    }

    console.log('✅ Demo data created successfully');
    console.log('\n🔑 Demo credentials:');
    console.log('- SUPERADMIN: superadmin@system.com / SuperAdmin123!');
    console.log('- ADMIN 1: admin1@demo.com / Admin123!');
    console.log('- ADMIN 2: admin2@demo.com / Admin123!');
    console.log('- ORGADMIN 1: orgadmin1@techcorp-solutions.com / OrgAdmin123!');
    console.log('- ORGADMIN 2: orgadmin2@global-marketing-hub.com / OrgAdmin123!');
    console.log('- ORGADMIN 3: orgadmin3@sports-entertainment-co.com / OrgAdmin123!');
    console.log('- USER Example: user1@techcorp-solutions.com / User123!');
    console.log('\n📊 Created:');
    console.log(`- ${createdOrgs.length} Organizations`);
    console.log(`- ${orgAdmins.length} Organization Administrators`);
    console.log(`- ${users.length} Users`);
    console.log('- Multiple Partners with payment statuses');
    console.log('- Promotional campaigns with different statuses');
    console.log('- Merchandise items across all categories');
    console.log('- Notifications for user engagement testing');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
  }
};

// Initialize seed data
export const initializeData = async () => {
  console.log('🌱 Starting data seeding...');
  await seedFeatures();
  await createSuperAdmin();
  await createDemoData();
  console.log('✅ Data seeding completed!');
};

// Run seeding if called directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/org-access-control')
    .then(async () => {
      console.log('📦 MongoDB connected for seeding');
      await initializeData();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      process.exit(1);
    });
}