const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const {
    getUserCart,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearUserCart,
} = require("./cart.controller");

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

// Get user's cart
router.get("/", getUserCart);

// Add item to cart
router.post("/items", addItemToCart);

// Update cart item quantity
router.put("/items", updateCartItemQuantity);

// Remove item from cart
router.delete("/items", removeItemFromCart);

// Clear entire cart
router.delete("/", clearUserCart);

module.exports = router;
