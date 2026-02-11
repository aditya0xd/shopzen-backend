const z = require("zod")
const { registerUser, loginUser, googleOAuthCallback } = require('./auth.service');
const { registerSchema, loginSchema } = require('./auth.schema');
require('dotenv').config();


const register = async (req, res) => {

  const valid = registerSchema.safeParse(req.body)

  if (!valid.success) {
    return res.status(400).json({
      message: "Invalid request data"
    })
  }
  const {name, email, password } = valid.data;
  try {
    const user = await registerUser(name, email, password);
    res.status(201).json({ message: 'User registered', userId: user.id, });
  } catch (err) {
    console.error(err.message)
    res.status(400).json({ message: 'Invalid email or password' });

  }
};

const login = async (req, res) => {

  const valid = loginSchema.safeParse(req.body);
  if (!valid.success) {
    return res.status(400).json({
      message: "invalid credentials"
    })
  }
  const { email, password } = valid.data;
  try {

    const token = await loginUser(email, password);

    res.status(200).json(token);


  } catch (err) {
    console.error(err.message)
    res.status(401).json({ message: 'Invalid email or password' });

  }
};

/**
 * Google OAuth callback - called after successful authentication
 * Hardened with proper error handling and validation
 */
const googleCallback = async (req, res) => {
  try {
    // Validate that user was authenticated by Passport
    if (!req.user) {
      console.warn('[OAuth] Callback received without authenticated user');
      return res.status(401).json({ 
        message: 'Authentication failed - invalid user data' 
      });
    }

    // Validate essential user fields
    if (!req.user.id || !req.user.email) {
      console.error('[OAuth] Invalid user object from Passport', { user: req.user });
      return res.status(500).json({ 
        message: 'Authentication processing error' 
      });
    }

    // Call service to generate tokens
    const tokens = await googleOAuthCallback(req.user);

    // Return tokens to client with security headers
    return res.status(200).json({
      message: 'Google authentication successful',
      ...tokens,
      // Add hint about emailVerified status
      emailVerified: req.user.emailVerified === true,
    });
  } catch (err) {
    console.error('[OAuth] Google callback error:', {
      error: err.message,
      userId: req.user?.id,
      email: req.user?.email,
    });

    // Don't expose internal error details to client
    const statusCode = err.message?.includes('already exists') ? 400 : 500;
    res.status(statusCode).json({ 
      message: 'Google authentication failed',
      error: err.message?.includes('already exists') ? err.message : 'Authentication processing error'
    });
  }
};

module.exports = { register, login, googleCallback };
