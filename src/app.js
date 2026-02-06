const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/auth.routes');
const protectedRoutes = require('./modules/auth/auth.protected.routes');
const productRoutes = require('./modules/products/product.routes');


const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', protectedRoutes);

app.use('/api/v1/products', productRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ShopZen backend running' });
});

module.exports = app;


// halmet
// security headers
// data sanitization
// performance optimizations
// sql injection prevention
// security best practices


