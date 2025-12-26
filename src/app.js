const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/auth.routes');
const protectedRoutes = require('./modules/auth/auth.protected.routes');


const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/auth', protectedRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ShopZen backend running' });
});

module.exports = app;



