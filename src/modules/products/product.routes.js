const express = require('express');
const {
  create,
  getAll,
  getOne
} = require('./product.controller');

const authMiddleware = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/role.middleware');

const router = express.Router();

// Public routes
router.get('/', getAll);
router.get('/:id', getOne);

// Admin-only route
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  create
);

module.exports = router;
