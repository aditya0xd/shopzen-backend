const {
    createOrderFromCart,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
    createPayment,
    updatePaymentStatus,
} = require("./order.service");
const {
    createOrderSchema,
    updateOrderStatusSchema,
    createPaymentSchema,
    updatePaymentStatusSchema,
    getOrdersQuerySchema,
} = require("./order.schema");

/**
 * Create order from cart
 * POST /api/v1/orders
 */
const createOrder = async (req, res) => {
    const valid = createOrderSchema.safeParse(req.body);

    if (!valid.success) {
        return res.status(400).json({
            message: "Invalid request data",
            errors: valid.error.errors,
        });
    }

    const { address } = valid.data;
    const userId = req.user.userId;

    try {
        const order = await createOrderFromCart(userId, address);
        res.status(201).json({
            message: "Order created successfully",
            order,
        });
    } catch (err) {
        console.error(err.message);

        if (err.message === "CART_EMPTY") {
            return res.status(400).json({ message: "Cart is empty" });
        }

        if (err.message.startsWith("INSUFFICIENT_STOCK")) {
            return res.status(400).json({
                message: "Insufficient stock for one or more items",
            });
        }

        res.status(500).json({ message: "Failed to create order" });
    }
};

/**
 * Get user's orders
 * GET /api/v1/orders
 */
const getOrders = async (req, res) => {
    const valid = getOrdersQuerySchema.safeParse(req.query);

    if (!valid.success) {
        return res.status(400).json({
            message: "Invalid query parameters",
            errors: valid.error.errors,
        });
    }

    const userId = req.user.userId;
    const { status, limit, offset } = valid.data;

    try {
        const result = await getUserOrders(userId, { status, limit, offset });
        res.status(200).json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

/**
 * Get single order
 * GET /api/v1/orders/:orderId
 */
const getOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.userId;

    try {
        const order = await getOrderById(orderId, userId);
        res.status(200).json(order);
    } catch (err) {
        console.error(err.message);

        if (err.message === "ORDER_NOT_FOUND") {
            return res.status(404).json({ message: "Order not found" });
        }

        if (err.message === "UNAUTHORIZED") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        res.status(500).json({ message: "Failed to fetch order" });
    }
};

/**
 * Update order status
 * PATCH /api/v1/orders/:orderId/status
 */
const updateStatus = async (req, res) => {
    const valid = updateOrderStatusSchema.safeParse(req.body);

    if (!valid.success) {
        return res.status(400).json({
            message: "Invalid request data",
            errors: valid.error.errors,
        });
    }

    const { orderId } = req.params;
    const { status } = valid.data;
    const userId = req.user.userId;
    const role = req.user.role;

    try {
        const order = await updateOrderStatus(orderId, status, userId, role);
        res.status(200).json({
            message: "Order status updated",
            order,
        });
    } catch (err) {
        console.error(err.message);

        if (err.message === "ORDER_NOT_FOUND") {
            return res.status(404).json({ message: "Order not found" });
        }

        if (err.message === "UNAUTHORIZED") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        if (err.message === "ADMIN_ONLY") {
            return res.status(403).json({ message: "Admin access required" });
        }

        if (err.message === "CANNOT_CANCEL_ORDER") {
            return res
                .status(400)
                .json({ message: "Order cannot be cancelled at this stage" });
        }

        res.status(500).json({ message: "Failed to update order status" });
    }
};

/**
 * Cancel order
 * POST /api/v1/orders/:orderId/cancel
 */
const cancelUserOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.userId;

    try {
        const order = await cancelOrder(orderId, userId);
        res.status(200).json({
            message: "Order cancelled successfully",
            order,
        });
    } catch (err) {
        console.error(err.message);

        if (err.message === "ORDER_NOT_FOUND") {
            return res.status(404).json({ message: "Order not found" });
        }

        if (err.message === "UNAUTHORIZED") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        if (err.message === "CANNOT_CANCEL_ORDER") {
            return res
                .status(400)
                .json({ message: "Order cannot be cancelled at this stage" });
        }

        res.status(500).json({ message: "Failed to cancel order" });
    }
};

/**
 * Get all orders (admin only)
 * GET /api/v1/orders/admin/all
 */
const getAllOrdersAdmin = async (req, res) => {
    const valid = getOrdersQuerySchema.safeParse(req.query);

    if (!valid.success) {
        return res.status(400).json({
            message: "Invalid query parameters",
            errors: valid.error.errors,
        });
    }

    const { status, limit, offset } = valid.data;

    try {
        const result = await getAllOrders({ status, limit, offset });
        res.status(200).json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

/**
 * Create payment for order
 * POST /api/v1/orders/:orderId/payment
 */
const createOrderPayment = async (req, res) => {
    const valid = createPaymentSchema.safeParse(req.body);

    if (!valid.success) {
        return res.status(400).json({
            message: "Invalid request data",
            errors: valid.error.errors,
        });
    }

    const { orderId } = req.params;
    const paymentData = valid.data;

    try {
        const payment = await createPayment(orderId, paymentData);
        res.status(201).json({
            message: "Payment record created",
            payment,
        });
    } catch (err) {
        console.error(err.message);

        if (err.message === "ORDER_NOT_FOUND") {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(500).json({ message: "Failed to create payment" });
    }
};

/**
 * Update payment status
 * PATCH /api/v1/orders/:orderId/payment
 */
const updateOrderPaymentStatus = async (req, res) => {
    const valid = updatePaymentStatusSchema.safeParse(req.body);

    if (!valid.success) {
        return res.status(400).json({
            message: "Invalid request data",
            errors: valid.error.errors,
        });
    }

    const { orderId } = req.params;
    const { status, providerPaymentId } = valid.data;

    try {
        const payment = await updatePaymentStatus(orderId, status, providerPaymentId);
        res.status(200).json({
            message: "Payment status updated",
            payment,
        });
    } catch (err) {
        console.error(err.message);

        if (err.message === "PAYMENT_NOT_FOUND") {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.status(500).json({ message: "Failed to update payment status" });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrder,
    updateStatus,
    cancelUserOrder,
    getAllOrdersAdmin,
    createOrderPayment,
    updateOrderPaymentStatus,
};
