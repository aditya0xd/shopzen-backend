const express = require('express');
const { get, add, remove, move } = require('./wishlist.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', get);
router.post('/items', add);
router.delete('/items/:productId', remove);
router.post('/items/move-to-cart', move);

module.exports = router;
