const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const serviceAuth = require('../middleware/serviceAuth');
const FileMetadata = require('../models/FileMetadata');
const fs = require('fs');
const replicator = require('../services/replicator');

const NODE_ID = process.env.NODE_ID || 'storage-node-1';

// @route   POST /api/files/upload
// @desc    Upload a file to this node
// @access  Private (Gateway authenticated)
router.post('/upload', serviceAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { gatewayDocumentId, isReplica, fileId, replicaNodeUrl, replicaNodeId } = req.body;

    // Save metadata to MongoDB
    // If it's a replica, use the exact fileId provided by primary node
    const finalFileId = (isReplica === 'true' && fileId) ? fileId : req.file.filename;

    const metadata = await FileMetadata.create({
      fileId: finalFileId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      nodeId: NODE_ID,
      path: req.file.path
    });

    // If this is the primary upload (not a replica push), trigger replication in background
    if (isReplica !== 'true' && gatewayDocumentId) {
      replicator.replicateFile(metadata, gatewayDocumentId, replicaNodeUrl, replicaNodeId);
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: metadata
    });
  } catch (error) {
    // If DB fails, remove the uploaded file to avoid orphaned files
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/files/:fileId
// @desc    Download/Get a file by ID
// @access  Private
router.get('/:fileId', serviceAuth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const metadata = await FileMetadata.findOne({ fileId });

    if (!metadata) {
      return res.status(404).json({ success: false, error: 'File metadata not found' });
    }

    if (!fs.existsSync(metadata.path)) {
      return res.status(404).json({ success: false, error: 'File physically missing from storage node' });
    }

    // Send file to client
    res.setHeader('Content-Type', metadata.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
    const fileStream = fs.createReadStream(metadata.path);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/files/:fileId
// @desc    Delete a file
// @access  Private (Gateway authenticated)
router.delete('/:fileId', serviceAuth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const metadata = await FileMetadata.findOne({ fileId });

    if (!metadata) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Delete physically
    if (fs.existsSync(metadata.path)) {
      fs.unlinkSync(metadata.path);
    }

    // Delete metadata
    await FileMetadata.deleteOne({ fileId });

    res.status(200).json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
