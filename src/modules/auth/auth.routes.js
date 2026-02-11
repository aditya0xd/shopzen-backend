const express = require('express');
const limiter = require('../../middleware/limiter.middleware');
const { register, login, googleCallback } = require('./auth.controller');
const passport = require('../../config/passport');

const router = express.Router();

// Traditional email/password auth
router.post('/register', limiter, register);
router.post('/login', limiter, login);

// Google OAuth routes with strictest rate limiting for callback
// Prevent enumeration attacks and account takeover attempts
const oauthCallbackLimiter = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // 10 requests per window (v6 uses limit or max, v7 prefers limit is deprecated? wait, check docs)
    // Actually v7 uses `limit` -> `max`. Let's use `max` to be safe.
    max: 10,
    message: 'Too many authentication attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/google',
    limiter, // Standard rate limit on OAuth initiation
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,  // We use JWT, not sessions
        accessType: 'online',
        prompt: 'consent', // Force consent to ensure fresh token
    })
);

router.get('/google/callback',
    oauthCallbackLimiter, // Stricter rate limit on callback
    passport.authenticate('google', {
        failureRedirect: '/api/v1/auth/google/failure',
        session: false
    }),
    googleCallback
);

// Google OAuth failure route with detailed error handling
router.get('/google/failure', oauthCallbackLimiter, (req, res) => {
    const error = req.query.error || 'unknown_error';
    const errorDescription = req.query.error_description || 'Google authentication failed';

    console.warn('[OAuth] Google authentication failure', {
        error,
        description: errorDescription,
        ip: req.ip,
    });

    // Don't leak sensitive info to client
    res.status(401).json({
        message: 'Google authentication failed',
        error: 'Please try again or contact support if the problem persists.'
    });
});

module.exports = router;
