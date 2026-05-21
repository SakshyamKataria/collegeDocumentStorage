// Gateway Server - Entry Point
// Distributed Student Document Repository

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const logger = require('./utils/logger');

// Connect to Database
const connectDB = require('./config/db');
connectDB();

// Connect to Redis
const { connectRedis, EventBus } = require('./config/redis');
const { CHANNELS } = require('./config/events');

const app = express();
const server = http.createServer(app);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN } // Configurable via CORS_ORIGIN env var
});

const PORT = process.env.PORT || 5000;

// Expose io instance to app
app.set('io', io);

// Start Node Manager Heartbeat Monitor and pass io
const nodeManager = require('./services/nodeManager');

// Initialize Redis and Subscriptions
connectRedis().then(() => {
  nodeManager.startMonitoring(io);

  EventBus.subscribe(CHANNELS.REPLICATION_EVENTS, async (data) => {
    try {
      const { documentId, status, replicaNode } = data;
      const Document = require('./models/Document');
      const doc = await Document.findById(documentId);
      if (doc) {
        doc.replicationStatus = status;
        if (status === 'completed' && replicaNode && !doc.replicaNodes.includes(replicaNode)) {
          doc.replicaNodes.push(replicaNode);
        }
        await doc.save();
        console.log(`🔄 Replication Event: Doc ${documentId} on ${replicaNode} -> ${status}`);

        if (io) {
          io.emit('document:replicationUpdated', {
            id: doc._id,
            replicationStatus: doc.replicationStatus,
            replicaNodes: doc.replicaNodes
          });
        }
      }
    } catch (e) {
      console.error('Error handling replication event:', e);
    }
  });
});

// Middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom handler for rate limits to emit SECURITY alert
const rateLimitHandler = (req, res, next, options) => {
  const nodeManager = require('./services/nodeManager');
  nodeManager.addAlert('SECURITY', `Rate limit exceeded by IP: ${req.ip}`);
  res.status(options.statusCode).json({ success: false, error: 'Too many requests' });
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  handler: rateLimitHandler
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  handler: rateLimitHandler
});

app.use('/api', globalLimiter);

// Health check route
const mongoose = require('mongoose');
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gateway-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      readyState: mongoose.connection.readyState,
      status: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
    },
    redis: {
      status: EventBus.isConnected() ? 'connected' : 'disconnected'
    }
  });
});

// Route files
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const nodeRoutes = require('./routes/nodes');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');

// Mount routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/analytics', analyticsRoutes);
// app.use('/api/nodes', nodeRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
server.listen(PORT, () => {
  logger.system(`Gateway Server running on port ${PORT}`);
  logger.system(`Environment: ${process.env.NODE_ENV}`);
});
