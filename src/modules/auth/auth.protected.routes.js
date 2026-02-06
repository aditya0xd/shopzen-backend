const express = require('express');
const authMiddleware = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

const router = express.Router();

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    message: 'Access granted',
    user: req.user
  });
});

// ADMIN-ONLY ROUTE
router.post(
  '/admin-only',
  authMiddleware,
  requireRole('ADMIN'),
  (req, res) => {
    res.json({ message: 'Admin access granted' });
  }
);


module.exports = router;
