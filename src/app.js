const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');

const authRoutes = require('./modules/auth/auth.routes');
const protectedRoutes = require('./modules/auth/auth.protected.routes');
const productRoutes = require('./modules/products/product.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/orders/order.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');


const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Initialize Passport for OAuth
app.use(passport.initialize());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', protectedRoutes);

app.use('/api/v1/products', productRoutes)
app.use('/api/v1/cart', cartRoutes)
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);


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


