const prisma = require("../../utils/prisma");

/**
 * Create order from user's cart
 */
const createOrderFromCart = async (userId, addressData) => {
    // Get user's cart with items
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!cart || cart.items.length === 0) {
        throw new Error("CART_EMPTY");
    }

    // Validate stock for all items
    for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
            throw new Error(`INSUFFICIENT_STOCK_${item.product.title}`);
        }
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = cart.items.map((item) => {
        const price = item.product.price;
        const discount = item.product.discountPercentage || 0;
        const finalPrice = price - (price * discount) / 100;
        totalAmount += finalPrice * item.quantity;

        return {
            productId: item.productId,
            quantity: item.quantity,
            price: finalPrice,
        };
    });

    // Create order with items and address in a transaction
    const order = await prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
            data: {
                userId,
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                status: "PENDING",
                items: {
                    create: orderItems,
                },
                orderAddress: {
                    create: addressData,
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                orderAddress: true,
            },
        });

        // Update product stock
        for (const item of cart.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        // Clear cart
        await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        return newOrder;
    });

    return order;
};

/**
 * Get all orders for a user
 */
const getUserOrders = async (userId, options = {}) => {
    const { status, limit = 10, offset = 0 } = options;

    const where = { userId };
    if (status) {
        where.status = status;
    }

    const orders = await prisma.order.findMany({
        where,
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            title: true,
                            thumbnail: true,
                            category: true,
                        },
                    },
                },
            },
            orderAddress: true,
            payment: true,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
        skip: offset,
    });

    const total = await prisma.order.count({ where });

    return {
        orders,
        total,
        limit,
        offset,
    };
};

/**
 * Get single order by ID
 */
const getOrderById = async (orderId, userId) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            orderAddress: true,
            payment: true,
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });

    if (!order) {
        throw new Error("ORDER_NOT_FOUND");
    }

    // Ensure user can only access their own orders
    if (order.userId !== userId) {
        throw new Error("UNAUTHORIZED");
    }

    return order;
};

/**
 * Update order status
 */
const updateOrderStatus = async (orderId, status, userId, role) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new Error("ORDER_NOT_FOUND");
    }

    // Only admin can update to SHIPPED or DELIVERED
    // Users can only cancel their own orders
    if (status === "CANCELLED") {
        if (order.userId !== userId) {
            throw new Error("UNAUTHORIZED");
        }
        if (order.status !== "PENDING" && order.status !== "PAID") {
            throw new Error("CANNOT_CANCEL_ORDER");
        }
    } else if (["SHIPPED", "DELIVERED"].includes(status)) {
        if (role !== "ADMIN") {
            throw new Error("ADMIN_ONLY");
        }
    }

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            orderAddress: true,
            payment: true,
        },
    });

    return updatedOrder;
};

/**
 * Cancel order (user action)
 */
const cancelOrder = async (orderId, userId) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true,
        },
    });

    if (!order) {
        throw new Error("ORDER_NOT_FOUND");
    }

    if (order.userId !== userId) {
        throw new Error("UNAUTHORIZED");
    }

    if (order.status !== "PENDING" && order.status !== "PAID") {
        throw new Error("CANNOT_CANCEL_ORDER");
    }

    // Update order status and restore stock
    const cancelledOrder = await prisma.$transaction(async (tx) => {
        // Update order status
        const updated = await tx.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED" },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                orderAddress: true,
                payment: true,
            },
        });

        // Restore product stock
        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        increment: item.quantity,
                    },
                },
            });
        }

        return updated;
    });

    return cancelledOrder;
};

/**
 * Get all orders (admin only)
 */
const getAllOrders = async (options = {}) => {
    const { status, limit = 20, offset = 0 } = options;

    const where = {};
    if (status) {
        where.status = status;
    }

    const orders = await prisma.order.findMany({
        where,
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            title: true,
                            thumbnail: true,
                        },
                    },
                },
            },
            orderAddress: true,
            payment: true,
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
        skip: offset,
    });

    const total = await prisma.order.count({ where });

    return {
        orders,
        total,
        limit,
        offset,
    };
};

/**
 * Create payment record for order
 */
const createPayment = async (orderId, paymentData) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new Error("ORDER_NOT_FOUND");
    }

    const payment = await prisma.payment.create({
        data: {
            orderId,
            provider: paymentData.provider,
            providerOrderId: paymentData.providerOrderId,
            providerPaymentId: paymentData.providerPaymentId,
            amount: order.totalAmount,
            currency: paymentData.currency || "INR",
            status: paymentData.status || "CREATED",
        },
    });

    return payment;
};

/**
 * Update payment status
 */
const updatePaymentStatus = async (orderId, status, paymentId = null) => {
    const payment = await prisma.payment.findUnique({
        where: { orderId },
    });

    if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
    }

    const updateData = { status };
    if (paymentId) {
        updateData.providerPaymentId = paymentId;
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
        // Update payment status
        const updated = await tx.payment.update({
            where: { orderId },
            data: updateData,
        });

        // If payment successful, update order status to PAID
        if (status === "SUCCESS") {
            await tx.order.update({
                where: { id: orderId },
                data: { status: "PAID" },
            });
        }

        return updated;
    });

    return updatedPayment;
};

module.exports = {
    createOrderFromCart,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
    createPayment,
    updatePaymentStatus,
};
