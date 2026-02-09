const z = require("zod")
const { registerUser, loginUser, googleOAuthCallback } = require('./auth.service');
const { registerSchema, loginSchema } = require('./auth.schema');


const register = async (req, res) => {

  const valid = registerSchema.safeParse(req.body)

  if (!valid.success) {
    return res.status(400).json({
      message: "Invalid request data"
    })
  }
  const { email, password } = valid.data;
  try {
    const user = await registerUser(email, password);
    res.status(201).json({ message: 'User registered', userId: user.id });
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
 */
const googleCallback = async (req, res) => {
  try {
    // req.user is populated by Passport after successful authentication
    const tokens = await googleOAuthCallback(req.user);

    // Send tokens to client
    // In production, you might redirect to frontend with tokens in query params or cookies
    res.status(200).json({
      message: 'Google authentication successful',
      ...tokens
    });
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

module.exports = { register, login, googleCallback };
