const express = require('express');
const limiter = require('../../middleware/limiter.middleware');
const { register, login } = require('./auth.controller');

const router = express.Router();

router.post('/register',limiter, register);
router.post('/login',limiter, login);

module.exports = router;




