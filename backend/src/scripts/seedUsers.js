const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Default users for each role
    const defaultUsers = [
      {
        name: 'Site Administrator',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'siteAdmin',
      },
      {
        name: 'Artist User',
        email: 'artist@example.com',
        password: 'artist123',
        role: 'artist',
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: 'user123',
        role: 'user',
      },
    ];

    // Create users
    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
      } else {
        const user = await User.create(userData);
        console.log(`✓ Created ${userData.role}: ${userData.email}`);
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Default User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Site Admin:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('\nArtist:');
    console.log('  Email: artist@example.com');
    console.log('  Password: artist123');
    console.log('\nRegular User:');
    console.log('  Email: user@example.com');
    console.log('  Password: user123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

// Run seed
seedUsers();

