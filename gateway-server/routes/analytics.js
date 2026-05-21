const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');
const DailyMetric = require('../models/DailyMetric');
const nodeManager = require('../services/nodeManager');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const userFilter = req.user.role === 'admin' ? {} : { uploadedBy: req.user.id };

    const totalDocuments = await Document.countDocuments(userFilter);
    const totalUsers = req.user.role === 'admin' ? await User.countDocuments() : undefined;
    const replicatedDocuments = await Document.countDocuments({ ...userFilter, replicationStatus: 'completed' });
    const failedUploads = await Document.countDocuments({ ...userFilter, replicationStatus: 'failed' });

    const sizeAggregation = await Document.aggregate([
      { $match: userFilter },
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);
    const totalSizeBytes = sizeAggregation[0]?.totalSize || 0;

    const activeNodes = nodeManager.getActiveNodes().length;
    const totalNodeCount = nodeManager.nodes.length;

    const replicationRate = totalDocuments > 0 ? ((replicatedDocuments / totalDocuments) * 100).toFixed(1) : 0;

    let formattedSize = '0 MB';
    if (totalSizeBytes > 0) {
      formattedSize = (totalSizeBytes / (1024 * 1024)).toFixed(2) + ' MB';
      if (totalSizeBytes > 1024 * 1024 * 1024) {
        formattedSize = (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      }
    }

    // Fetch last 7 days of real network metrics
    const metrics = await DailyMetric.find().sort({ date: -1 }).limit(7);
    metrics.reverse(); // oldest to newest
    
    const chartData = metrics.map(m => {
      const dateObj = new Date(m.date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        name: days[dateObj.getUTCDay()],
        uploads: Math.round(m.totalUploadBytes / 1024), // Show in KB
        downloads: Math.round(m.totalDownloadBytes / 1024)
      };
    });

    // Pad if there isn't enough historical data yet
    while (chartData.length < 7) {
      chartData.unshift({ name: '—', uploads: 0, downloads: 0 });
    }

    const responseData = {
      totalDocuments,
      totalSize: formattedSize,
      replicationRate: `${replicationRate}%`,
      failedUploads,
      activeNodes,
      totalNodeCount,
      chartData
    };

    if (req.user.role === 'admin') {
      responseData.totalUsers = totalUsers;
    }

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
