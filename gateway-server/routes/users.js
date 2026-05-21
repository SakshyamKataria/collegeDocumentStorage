const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({ success: true, count: users.length, data: users });
}));

// @route   PUT /api/users/:id/role
// @desc    Promote or demote a user role
// @access  Private/Admin
router.put('/:id/role', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Role must be either admin or user' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true, context: 'query' }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('user:roleUpdated', { id: user._id, role: user.role, email: user.email });
  }

  // Broadcast & Persist Audit Log in Memory Buffer
  const nodeManager = require('../services/nodeManager');
  const auditMsg = `Admin ${req.user.email} changed role of ${user.email} to ${role}`;
  nodeManager.addAlert('AUDIT', auditMsg);

  // Persist Audit Log in DB
  await AuditLog.create({
    action: 'ROLE_UPDATE',
    details: `Role of ${user.email} changed to ${role}`,
    performedBy: req.user.id,
    performedByEmail: req.user.email
  });

  res.status(200).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

// @route   DELETE /api/users/:id
// @desc    Delete a user account
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  await user.deleteOne();
  
  const io = req.app.get('io');
  if (io) {
    io.emit('user:deleted', { id: user._id, email: user.email });
  }

  // Broadcast & Persist Audit Log in Memory Buffer
  const nodeManager = require('../services/nodeManager');
  const auditMsg = `Admin ${req.user.email} deleted user ${user.email}`;
  nodeManager.addAlert('AUDIT', auditMsg);

  // Persist Audit Log in DB
  await AuditLog.create({
    action: 'USER_DELETE',
    details: `Deleted user ${user.email}`,
    performedBy: req.user.id,
    performedByEmail: req.user.email
  });

  res.status(200).json({ success: true, message: 'User deleted successfully' });
}));

module.exports = router;
