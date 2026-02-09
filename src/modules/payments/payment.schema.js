const z = require("zod");

// Enums from Schema for reference
const PaymentProvider = z.enum(["STRIPE", "RAZORPAY", "PAYPAL"]);
const PaymentStatus = z.enum([
    "CREATED",
    "PENDING",
    "SUCCESS",
    "FAILED",
    "REFUNDED",
]);

/**
 * Schema to initiate a payment
 */
const initiatePaymentSchema = z.object({
    orderId: z.string().uuid("Invalid Order ID"),
    provider: PaymentProvider,
    amount: z.number().int().positive().optional(), // In case frontend sends it, but should prioritize backend order total
    currency: z.string().default("INR"),
});

/**
 * Schema to verify a payment (e.g. razorpay_signature)
 */
const verifyPaymentSchema = z.object({
    paymentId: z.string().min(1, "Payment ID is required"),
    orderId: z.string().min(1, "Order ID is required"),
    signature: z.string().optional(), // For Razorpay
    provider: PaymentProvider,
});

/**
 * Schema for manual status update (Admin/Dev)
 */
const updatePaymentSchema = z.object({
    status: PaymentStatus,
    providerPaymentId: z.string().optional(),
});

module.exports = {
    initiatePaymentSchema,
    verifyPaymentSchema,
    updatePaymentSchema,
};
