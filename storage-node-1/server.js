// Storage Node 1 - Entry Point
// Distributed Student Document Repository

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Connect to Database
const connectDB = require('./config/db');
connectDB();

// Connect to Redis
const { connectRedis, EventBus } = require('./config/redis');
const { CHANNELS } = require('./config/events');
const FileMetadata = require('./models/FileMetadata');
const replicator = require('./services/replicator');

connectRedis().then(() => {
  // Listen for distributed deletes
  EventBus.subscribe(CHANNELS.DOCUMENT_DELETED, async (data) => {
    try {
      const { fileId } = data;
      const metadata = await FileMetadata.findOne({ fileId });
      if (metadata) {
        if (fs.existsSync(metadata.path)) {
          fs.unlinkSync(metadata.path);
        }
        await FileMetadata.deleteOne({ fileId });
        console.log(`🗑️ Distributed Delete: Removed ${fileId}`);
      }
    } catch (err) {
      console.error(`❌ Distributed Delete failed for ${data.fileId}:`, err.message);
    }
  });
});

// Start background replication worker
setInterval(() => replicator.processQueue(), 10000);

const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ID = process.env.NODE_ID || 'storage-node-1';

// Ensure upload directory exists
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  // Calculate storage stats
  let totalSize = 0;
  let fileCount = 0;
  try {
    const files = fs.readdirSync(uploadDir);
    fileCount = files.length;
    files.forEach((file) => {
      const stats = fs.statSync(path.join(uploadDir, file));
      totalSize += stats.size;
    });
  } catch (err) {
    // uploads dir might not exist yet
  }

  res.json({
    status: 'ok',
    nodeId: NODE_ID,
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    storage: {
      uploadDir,
      fileCount,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
    },
    database: {
      readyState: mongoose.connection.readyState,
      status: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
    },
    redis: {
      status: EventBus.isConnected() ? 'connected' : 'disconnected'
    }
  });
});

// File routes
const fileRoutes = require('./routes/files');
app.use('/api/files', fileRoutes);

// Broadcast heartbeat via Redis EventBus
setInterval(() => {
  let totalSize = 0;
  try {
    const files = fs.readdirSync(uploadDir);
    files.forEach(f => { totalSize += fs.statSync(path.join(uploadDir, f)).size; });
  } catch (e) {}

  EventBus.publish(CHANNELS.NODE_HEARTBEAT, {
    nodeId: NODE_ID,
    url: process.env.SELF_URL || `http://localhost:${PORT}`,
    timestamp: Date.now(),
    sentAt: Date.now(), // For ping latency calculation
    totalSize
  });
}, 5000);

// Graceful shutdown for deregistration
const shutdown = () => {
  console.log(`\n⚠️ Storage Node [${NODE_ID}] shutting down (Graceful Deregistration)...`);
  EventBus.publish(CHANNELS.NODE_DEREGISTER, { nodeId: NODE_ID })
    .finally(() => {
      process.exit(0);
    });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(PORT, () => {
  console.log(`\n📦 Storage Node [${NODE_ID}] running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
});
