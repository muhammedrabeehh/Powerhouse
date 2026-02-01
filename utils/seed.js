require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin already exists.');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt); // Default password

    const admin = new User({
      name: 'Super Admin',
      email: 'admin@powerhouse.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });

    await admin.save();
    console.log('✅ Admin User Created: admin@powerhouse.com / Admin123!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();