const express = require('express');
const limiter = require('../../middleware/limiter.middleware');
const { register, login, googleCallback } = require('./auth.controller');
const passport = require('../../config/passport');

const router = express.Router();

// Traditional email/password auth
router.post('/register', limiter, register);
router.post('/login', limiter, login);

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false  // We use JWT, not sessions
    })
);

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/api/v1/auth/google/failure',
        session: false
    }),
    googleCallback
);

// Google OAuth failure route
router.get('/google/failure', (req, res) => {
    res.status(401).json({ message: 'Google authentication failed' });
});

module.exports = router;
