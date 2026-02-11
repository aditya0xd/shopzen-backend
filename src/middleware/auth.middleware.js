const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }


  const token = authHeader.split(' ')[1];


  try {

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { userId, role }
    next();
  } catch(error) {
    console.log(error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = authMiddleware;
