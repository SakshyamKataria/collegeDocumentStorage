const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a document title']
  },
  description: {
    type: String,
  },
  originalName: {
    type: String,
    required: true
  },
  fileId: {
    type: String,
    required: true
  },
  visibility: {
    type: String,
    enum: ['private', 'shared'],
    default: 'private'
  },
  mimeType: {
    type: String,
  },
  size: {
    type: Number,
  },
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  primaryNode: {
    type: String,
    required: true
  },
  replicationStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  replicaNodes: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', DocumentSchema);
