// Storage Node 1 - Entry Point
// Distributed Student Document Repository

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Connect to Database
const connectDB = require('./config/db');
connectDB();

// Connect to Redis
const { connectRedis, getPublisher } = require('./config/redis');
connectRedis();

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
  });
});

// File routes
const fileRoutes = require('./routes/files');
app.use('/api/files', fileRoutes);

// Broadcast heartbeat via Redis
setInterval(() => {
  const publisher = getPublisher();
  if (publisher) {
    let totalSize = 0;
    try {
      const files = fs.readdirSync(uploadDir);
      files.forEach(f => { totalSize += fs.statSync(path.join(uploadDir, f)).size; });
    } catch (e) {}

    publisher.publish('node:heartbeat', JSON.stringify({
      nodeId: NODE_ID,
      url: `http://localhost:${PORT}`,
      timestamp: Date.now(),
      totalSize
    }));
  }
}, 5000);

// Start server
app.listen(PORT, () => {
  console.log(`\n📦 Storage Node [${NODE_ID}] running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
});
