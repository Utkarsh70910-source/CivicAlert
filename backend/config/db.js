/**
 * CivicAlert - Database Connection & Seeding Module
 * 
 * Supports:
 * 1. MongoDB Atlas / local MongoDB connection via process.env.MONGODB_URI
 * 2. Idempotent seeding of Admin, Workers, Citizen, and Sample Complaints
 * 3. Safe fallback persistence when running in environments without MONGODB_URI
 */

const mongoose = require('mongoose');
const { User, Complaint } = require('../models');
const { mockUsers, mockComplaints } = require('../data/mockData');

let isConnected = false;

// Setup Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('[Database] MongoDB connection established successfully.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('[Database] MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database] MongoDB disconnected.');
});

/**
 * Connect to MongoDB database
 */
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('----------------------------------------------------');
    console.log('[Database] NOTICE: MONGODB_URI is not set in environment.');
    console.log('[Database] In production (Render), configure MONGODB_URI with your MongoDB Atlas connection string.');
    console.log('[Database] Operating with local persistent data storage.');
    console.log('----------------------------------------------------');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000, // 15 seconds timeout for reliable cloud Atlas connection
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);

    // Seed database idempotently
    await seedDatabase();
    return true;
  } catch (error) {
    console.error(`[Database] MongoDB connection failed: ${error.message}`);
    console.log('[Database] Falling back to local persistent store so server remains available.');
    return false;
  }
}

/**
 * Idempotently seeds initial admin, workers, default citizen, and complaints if collections are empty.
 * Never creates duplicate records.
 */
async function seedDatabase() {
  try {
    // 1. Seed Users (Admin, Workers, Citizen)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Database] Seeding initial users into MongoDB...');
      for (const u of mockUsers) {
        await User.create({
          customId: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          username: u.username,
          password: u.password, // Mongoose pre-save hook will hash this with bcrypt!
          role: u.role,
          workerId: u.workerId || undefined,
          category: u.category || undefined,
          specialization: u.specialization || undefined,
          status: u.status || 'Active',
        });
      }
      console.log(`[Database] Successfully seeded ${mockUsers.length} initial users into MongoDB.`);
    }

    // 2. Seed Complaints
    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0) {
      console.log('[Database] Seeding initial complaints into MongoDB...');
      for (const c of mockComplaints) {
        await Complaint.create({
          customId: c.id,
          referenceId: c.referenceId,
          category: c.category,
          priority: c.priority || 'Medium',
          title: c.title || c.category,
          description: c.description,
          location: c.location,
          latitude: c.latitude,
          longitude: c.longitude,
          photos: c.photos || (c.photoPreview ? [c.photoPreview] : []),
          photoPreview: c.photoPreview,
          status: c.status,
          citizenId: c.citizenId || null,
          citizenName: c.citizenName || 'Anonymous Resident',
          citizenPhone: c.citizenPhone || null,
          assignedWorkerId: c.assignedWorkerId || null,
          assignedWorkerName: c.assignedWorkerName || null,
          assignedWorkerPhone: c.assignedWorkerPhone || null,
          expectedCompletionDate: c.expectedCompletionDate || null,
          resolutionNotes: c.resolutionNotes || null,
          resolutionPhoto: c.resolutionPhoto || null,
          resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : null,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        });
      }
      console.log(`[Database] Successfully seeded ${mockComplaints.length} initial complaints into MongoDB.`);
    }
  } catch (err) {
    console.error('[Database] Seeding error (non-fatal):', err.message);
  }
}

function getIsConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  seedDatabase,
  getIsConnected,
};

