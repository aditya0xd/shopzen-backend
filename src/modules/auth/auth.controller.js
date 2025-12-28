const { registerUser, loginUser } = require('./auth.service');

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await registerUser(email, password);
    res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if(email === undefined || password === undefined) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if(email.trim() === '' || password.trim() === '') {
      return res.status(400).json({ error: 'Email and password cannot be empty' });
    }
    const token = await loginUser(email, password);
    res.status(200).json(token);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

module.exports = { register, login };
