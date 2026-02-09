const prisma = require("../../utils/prisma");

/**
 * Metadata for Gemini Function Calling
 */
const toolsDefinition = [
    {
        functionDeclarations: [
            {
                name: "searchProducts",
                description: "Search for products in the store catalog based on a query string.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: {
                            type: "STRING",
                            description: "The search term (e.g., 'running shoes', 'iphone')",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "getOrderStatus",
                description: "Get the current status and delivery info of a specific order.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        orderCode: {
                            type: "STRING",
                            description: "The order ID or code provided by the user.",
                        },
                    },
                    required: ["orderCode"],
                },
            },
            {
                name: "escalateToHuman",
                description: "Escalate the conversation to a human agent when the user is angry or the request is too complex.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        reason: {
                            type: "STRING",
                            description: "The reason for escalation.",
                        },
                    },
                    required: ["reason"],
                },
            },
        ],
    },
];

/**
 * Implementation of Tools
 */
const toolsImplementation = {
    searchProducts: async ({ query }) => {
        console.log(`[Tool] Searching products: ${query}`);
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                    { category: { contains: query, mode: "insensitive" } },
                ],
            },
            take: 5,
            select: {
                id: true,
                title: true,
                price: true,
                stock: true,
                availabilityStatus: true,
            },
        });

        if (products.length === 0) {
            return { message: "No products found matching that query." };
        }
        return { products };
    },

    getOrderStatus: async ({ orderCode }, userId) => {
        console.log(`[Tool] Checking order: ${orderCode} for user: ${userId}`);
        // Support partial match for convenience if needed, but exact UUID is safer
        // But users rarely type full UUIDs. Let's assume they might paste it.
        // Or we handle short codes if we had them. For now, try findUnique.

        try {
            const order = await prisma.order.findFirst({
                where: {
                    id: orderCode, // In real app, might be a friendly ID
                    userId: userId, // Security: Ensure user owns order
                },
                include: {
                    items: {
                        include: { product: { select: { title: true } } }
                    },
                    payment: { select: { status: true } }
                }
            });

            if (!order) {
                return { error: "Order not found or does not belong to you." };
            }

            return {
                id: order.id,
                status: order.status,
                total: order.totalAmount,
                paymentStatus: order.payment?.status || "UNPAID",
                items: order.items.map(i => `${i.quantity}x ${i.product.title}`),
                date: order.createdAt
            };
        } catch (e) {
            return { error: "Invalid Order ID format." };
        }
    },

    escalateToHuman: async ({ reason }) => {
        console.log(`[Tool] Escalating to human: ${reason}`);
        // In a real system, this would trigger a ticket/notification
        return {
            escalated: true,
            message: "I have notified a human specialist. They will review this conversation and contact you shortly."
        };
    }
};

module.exports = {
    toolsDefinition,
    toolsImplementation
};
