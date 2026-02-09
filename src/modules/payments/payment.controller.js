const {
    initiatePayment,
    verifyPayment,
    updatePaymentStatus,
    getPaymentByOrder,
    processWebhookEvent,
    processMockPayment
} = require("./payment.service");

const {
    initiatePaymentSchema,
    verifyPaymentSchema,
    updatePaymentSchema
} = require("./payment.schema");

// ... existing controller methods ...

/**
 * Handle Razorpay Webhook
 * POST /api/v1/payments/webhook
 */
const webhookHandler = async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body;

    if (!signature) {
        return res.status(400).json({ error: "Missing signature" });
    }

    try {
        // In a real production app, ensure raw body is passed here
        const result = await processWebhookEvent(body, signature);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Webhook Error:", error);
        return res.status(500).json({ error: "Webhook processing failed" });
    }
};

/**
 * Initiate a payment
 * POST /api/v1/payments/initiate
 */
const startPayment = async (req, res) => {
    const result = initiatePaymentSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { orderId, provider } = result.data;
    const userId = req.user.userId; // Provided by authMiddleware

    try {
        const response = await initiatePayment(userId, orderId, provider);
        return res.status(200).json(response);
    } catch (error) {
        console.error(error);
        if (error.message === "ORDER_NOT_FOUND") {
            return res.status(404).json({ error: "Order not found" });
        }
        if (error.message === "ORDER_ALREADY_PAID") {
            return res.status(400).json({ error: "Order already paid" });
        }
        if (error.message === "ORDER_CANCELLED") {
            return res.status(400).json({ error: "Order is cancelled" });
        }
        return res.status(500).json({ error: "Failed to initiate payment" });
    }
};

/**
 * Verify a payment
 * POST /api/v1/payments/confirm
 */
const confirmPayment = async (req, res) => {
    const result = verifyPaymentSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
    }

    try {
        const payment = await verifyPayment(result.data);
        return res.status(200).json({ message: "Verification successful", payment });
    } catch (error) {
        console.error(error);
        if (error.message === "PAYMENT_NOT_FOUND") {
            return res.status(404).json({ error: "Payment not found" });
        }
        if (error.message === "INVALID_SIGNATURE") {
            return res.status(400).json({ error: "Invalid payment signature" });
        }
        return res.status(500).json({ error: "Verification failed" });
    }
};

/**
 * Manually update payment status (Admin or Webhook fallback)
 * PATCH /api/v1/payments/:id
 */
const updateStatus = async (req, res) => {
    const { id } = req.params;

    const result = updatePaymentSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { status, providerPaymentId } = result.data;

    try {
        const updated = await updatePaymentStatus(id, status, providerPaymentId);
        return res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to update payment status" });
    }
};

/**
 * Get payment for an order
 * GET /api/v1/payments/orders/:orderId
 */
const getOrderPayment = async (req, res) => {
    const { orderId } = req.params;

    try {
        const payment = await getPaymentByOrder(orderId);
        if (!payment) {
            return res.status(404).json({ error: "No payment found for this order" });
        }
        return res.status(200).json(payment);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to fetch payment" });
    }
};

/**
 * Process Mock Payment (Dev/Demo Only)
 * POST /api/v1/payments/mock-success
 */
const mockPaymentSuccess = async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
    }

    try {
        const result = await processMockPayment(orderId);
        return res.status(200).json({
            message: "Mock payment successful",
            ...result
        });
    } catch (err) {
        console.error("Mock Payment Error:", err);
        return res.status(500).json({ error: err.message || "Failed to process mock payment" });
    }
};

module.exports = {
    startPayment,
    confirmPayment,
    updateStatus,
    getOrderPayment,
    webhookHandler,
    mockPaymentSuccess
};
