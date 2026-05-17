const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Document = require('../models/Document');
const nodeManager = require('../services/nodeManager');
const uploadQueue = require('../services/uploadQueue');

// @route   POST /api/documents/upload
// @desc    Upload document through Gateway to a Storage Node
// @access  Private
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const { title, description, visibility = 'private' } = req.body;

    if (!['private', 'shared'].includes(visibility)) {
      return res.status(400).json({ success: false, error: 'Invalid document visibility' });
    }

    // 1. Get next available node (Load Balancing)
    const targetNode = nodeManager.getNextAvailableNode();

    // 2. Pre-create aggregated metadata in the Central Database (Status: Pending)
    const document = await Document.create({
      title: title || req.file.originalname,
      description,
      visibility,
      originalName: req.file.originalname,
      fileId: 'pending', 
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
      primaryNode: targetNode.id
    });

    // 3. Prepare form data to forward
    const formData = new FormData();
    formData.append('file', req.file.buffer, { filename: req.file.originalname });
    formData.append('gatewayDocumentId', document._id.toString());

    // 4. Wrap the network forward in the Upload Queue to handle concurrency 
    // and prevent duplicate writes of the same file by the same user
    const fileMetadata = await uploadQueue.enqueue(req.user.id, req.file.originalname, async () => {
      const nodeResponse = await axios.post(`${targetNode.url}/api/files/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      return nodeResponse.data.data;
    });

    // 5. Update Central Database with the actual physical fileId
    document.fileId = fileMetadata.fileId;
    await document.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('document:created', document);
      io.emit('analytics:update');
    }

    // Node will automatically trigger replication in the background
    
    res.status(201).json({
      success: true,
      data: document,
      message: `File successfully uploaded to ${targetNode.id}`
    });

  } catch (error) {
    console.error('Upload Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to upload document' });
  }
});

// @route   PUT /api/documents/:id/replication-status
// @desc    Callback for storage nodes to report replication success
// @access  Public (should be protected by internal secret in prod)
router.put('/:id/replication-status', async (req, res) => {
  try {
    const { status, replicaNode } = req.body;
    
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, error: 'Document not found' });

    document.replicationStatus = status;
    if (status === 'completed' && replicaNode && !document.replicaNodes.includes(replicaNode)) {
      document.replicaNodes.push(replicaNode);
    }

    await document.save();
    const io = req.app.get('io');
    if (io) {
      io.emit('document:replicationUpdated', {
        id: document._id,
        replicationStatus: document.replicationStatus,
        replicaNodes: document.replicaNodes
      });
      io.emit('analytics:update');
    }

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/documents
// @desc    Get visible documents for the current user (or all if admin)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : {
          $or: [
            { uploadedBy: req.user.id },
            { visibility: 'shared' }
          ]
        };

    const documents = await Document.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/documents/:id
// @desc    Update document metadata (rename or visibility)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to update this document' });
    }

    const { title, description, visibility } = req.body;

    if (visibility && !['private', 'shared'].includes(visibility)) {
      return res.status(400).json({ success: false, error: 'Invalid document visibility' });
    }

    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (visibility) document.visibility = visibility;

    await document.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('document:updated', document);
      io.emit('analytics:update');
    }

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this document' });
    }

    const deleteTargets = [document.primaryNode, ...document.replicaNodes];
    for (const nodeId of Array.from(new Set(deleteTargets))) {
      const node = nodeManager.getNodeById(nodeId);
      if (node && node.status === 'online') {
        try {
          await axios.delete(`${node.url}/api/files/${document.fileId}`);
        } catch (err) {
          console.warn(`Failed to delete file from node ${nodeId}:`, err.message);
        }
      }
    }

    await document.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.emit('document:deleted', { id: document._id });
      io.emit('analytics:update');
    }

    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/documents/:id/download
// @desc    Download a document
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Check if the user has access to it
    if (req.user.role !== 'admin') {
      if (document.uploadedBy.toString() !== req.user.id && document.visibility !== 'shared') {
        return res.status(403).json({ success: false, error: 'Not authorized to download' });
      }
    }

    // Find where the file is stored
    let node = nodeManager.getNodeById(document.primaryNode);
    let targetNodeId = document.primaryNode;
    
    // Failover Logic: If primary is offline, try replicas
    if (!node || node.status !== 'online') {
      console.log(`⚠️ Primary node [${document.primaryNode}] is offline. Attempting failover...`);
      
      let replicaFound = false;
      for (const replicaId of document.replicaNodes) {
        const replicaNode = nodeManager.getNodeById(replicaId);
        if (replicaNode && replicaNode.status === 'online') {
          node = replicaNode;
          targetNodeId = replicaId;
          replicaFound = true;
          console.log(`🔄 Failover successful: Serving from replica [${replicaId}]`);
          break;
        }
      }

      if (!replicaFound) {
        return res.status(503).json({ 
          success: false, 
          error: 'File unavailable: Primary and all replica nodes are offline.' 
        });
      }
    }

    // Stream the file from the storage node to the client
    const response = await axios({
      method: 'GET',
      url: `${node.url}/api/files/${document.fileId}`,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to download file from node' });
  }
});

module.exports = router;
