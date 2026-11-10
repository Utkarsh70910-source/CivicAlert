/**
 * CivicAlert Backend - Express Server & REST API
 * 
 * Capstone Project: Functional Community Reporting System
 * 
 * Features implemented today:
 * 1. Health check & status verification
 * 2. Role-based Authentication & Session Management (/api/auth)
 * 3. Citizen Complaint Submission & Tracking (/api/complaints)
 * 4. Worker Portal task management & status updates
 * 5. Admin Portal dispatch, assignment & statistics
 * 
 * NOTE FOR COLLEGE VIVA:
 * This server runs with in-memory mock persistence for local testing.
 * The clean route/controller/middleware architecture is 100% prepared to swap
 * in MongoDB (Mongoose models) and JWT tomorrow without rewriting frontend code.
 */

// 1. Load environment variables
const dotenv = require('dotenv');
dotenv.config();

// 2. Import packages
const express = require('express');
const cors = require('cors');

// 3. Import route modules
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const workerRoutes = require('./routes/workerRoutes');
const statsRoutes = require('./routes/statsRoutes');

// 4. Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------------------------------------------------------------
// Middleware Configuration
// -----------------------------------------------------------------------------

// Allow cross-origin requests from the Vite React frontend
app.use(cors());

// Parse JSON request bodies (supports optional base64 image strings)
app.use(express.json({ limit: '10mb' }));

// -----------------------------------------------------------------------------
// API Routes
// -----------------------------------------------------------------------------

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    project: 'CivicAlert API',
    status: 'online',
    version: '1.0.0',
    documentation: {
      healthCheck: '/api/health',
      auth: '/api/auth/login',
      complaints: '/api/complaints',
      workers: '/api/workers',
      stats: '/api/stats',
    },
    mode: 'Local Development (In-Memory Mock Persistence)',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CivicAlert Backend API is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    activeSessionsCount: require('./data/mockData').mockActiveSessions.size,
    totalComplaintsCount: require('./data/mockData').mockComplaints.length,
  });
});

// Mount domain routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/stats', statsRoutes);

// 404 Route Handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' does not exist on this server.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: err.message,
  });
});

// -----------------------------------------------------------------------------
// Start Server
// -----------------------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`CivicAlert Backend Server is LIVE!`);
    console.log(`Port: ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

module.exports = app;
