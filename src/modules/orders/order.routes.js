const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const {
    createOrder,
    getOrders,
    getOrder,
    updateStatus,
    cancelUserOrder,
    getAllOrdersAdmin,
    createOrderPayment,
    updateOrderPaymentStatus,
} = require("./order.controller");

const router = express.Router();

// All order routes require authentication
router.use(authMiddleware);

// User routes
router.post("/", createOrder); // Create order from cart
router.get("/", getOrders); // Get user's orders
router.get("/:orderId", getOrder); // Get single order
router.post("/:orderId/cancel", cancelUserOrder); // Cancel order

// Payment routes
router.post("/:orderId/payment", createOrderPayment); // Create payment
router.patch("/:orderId/payment", updateOrderPaymentStatus); // Update payment status

// Admin routes
router.get("/admin/all", roleMiddleware("ADMIN"), getAllOrdersAdmin); // Get all orders
router.patch("/:orderId/status", updateStatus); // Update order status (admin or user for cancel)

module.exports = router;
