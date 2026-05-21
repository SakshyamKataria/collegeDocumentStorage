const mongoose = require('mongoose');

const ReplicationTaskSchema = new mongoose.Schema({
  fileId: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  gatewayDocumentId: { type: String, required: true },
  targetUrl: { type: String, required: true },
  replicaNodeId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'retrying', 'failed', 'completed'], 
    default: 'pending' 
  },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReplicationTask', ReplicationTaskSchema);
