// Gateway Server - Entry Point
// Distributed Student Document Repository

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to Database
const connectDB = require('./config/db');
connectDB();

// Connect to Redis
const { connectRedis, getSubscriber } = require('./config/redis');
connectRedis().then(() => {
  const subscriber = getSubscriber();
  if (subscriber) {
    subscriber.subscribe('replication:events', async (message) => {
      try {
        const { documentId, status, replicaNode } = JSON.parse(message);
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
            io.emit('analytics:update');
          }
        }
      } catch (err) {
        console.error('Error processing replication event via Redis', err);
      }
    });
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Allow frontend to connect
});

const PORT = process.env.PORT || 5000;

// Expose io instance to app
app.set('io', io);

// Start Node Manager Heartbeat Monitor and pass io
const nodeManager = require('./services/nodeManager');
nodeManager.startMonitoring(io);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gateway-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Route files
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const nodeRoutes = require('./routes/nodes');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');

// Mount routes
app.use('/api/auth', authRoutes);
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
  console.log(`\n🚀 Gateway Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
});
