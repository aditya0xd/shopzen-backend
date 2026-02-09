const express = require("express");
const {
    startPayment,
    confirmPayment,
    updateStatus,
    getOrderPayment,
    webhookHandler
} = require("./payment.controller");
const authMiddleware = require("../../middleware/auth.middleware");

const roleMiddleware = require("../../middleware/role.middleware");

const router = express.Router();

// Public routes (Webhooks)
router.post("/webhook", webhookHandler);

// Protected Routes
router.use(authMiddleware);

router.post("/initiate", startPayment);

router.post("/confirm", confirmPayment);

router.patch("/:id", roleMiddleware("ADMIN"), updateStatus);

router.post("/mock-success", mockPaymentSuccess);

router.get("/orders/:orderId", getOrderPayment);

module.exports = router;
