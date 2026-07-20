import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import redis from './config/redis.js'; // connects on import — logs ✅ / ❌
import { globalLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import analyticsRoutes from './routes/analytics.js';
import ocrRoutes from './routes/ocrRoutes.js';
import reminderRoutes from './routes/reminders.js';
import supplierAuthRoutes from './routes/supplierAuth.js';
import supplierPortalRoutes from './routes/supplierPortal.js';
import supplierAccountAuthRoutes from './routes/supplierAccountAuth.js';
import connectionsRoutes from './routes/connections.js';
import supplierConnectionsRoutes from './routes/supplierConnections.js';
import directoryRoutes from './routes/directory.js';
import supplierDirectoryRoutes from './routes/supplierDirectory.js';
import reminderCron from './jobs/reminderCron.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import { startReminderWorker } from './jobs/workers/reminderWorker.js';
import { startNotificationWorker } from './jobs/workers/notificationWorker.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Trust reverse proxy (important for rate limiting behind Render/proxies)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json({
  verify: (req, res, buf) => {
    // We need the raw body for Razorpay webhook signature verification
    if (req.originalUrl.startsWith('/api/payments/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Apply global rate limiter to all routes
app.use(globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/supplier-auth', supplierAuthRoutes);
app.use('/api/supplier-account', supplierAccountAuthRoutes);
app.use('/api/supplier-portal', supplierPortalRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/supplier-connections', supplierConnectionsRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/supplier-directory', supplierDirectoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', apiRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Digibill Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);

    // Start the BullMQ workers
    startReminderWorker();
    startNotificationWorker();

    // Start the payment reminder cron job
    reminderCron.start();
  });
}

export default app;
