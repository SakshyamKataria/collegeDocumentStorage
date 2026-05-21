const mongoose = require('mongoose');

const DailyMetricSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  totalUploadBytes: { type: Number, default: 0 },
  totalDownloadBytes: { type: Number, default: 0 }
});

module.exports = mongoose.model('DailyMetric', DailyMetricSchema);
