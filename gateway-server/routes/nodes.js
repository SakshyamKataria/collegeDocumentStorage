const express = require('express');
const router = express.Router();
const nodeManager = require('../services/nodeManager');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/nodes
// @desc    Get status of all storage nodes
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), (req, res) => {
  try {
    // Return the current state of nodes from the in-memory NodeManager
    res.status(200).json({
      success: true,
      data: nodeManager.nodes,
      alerts: nodeManager.alerts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
