const z = require("zod");

const createOrderSchema = z.object({
    address: z.object({
        fullName: z.string().min(1, "Full name is required"),
        phone: z.string().min(10, "Valid phone number is required"),
        line1: z.string().min(1, "Address line 1 is required"),
        line2: z.string().optional(),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        postalCode: z.string().min(1, "Postal code is required"),
        country: z.string().min(1, "Country is required"),
    }),
});

const updateOrderStatusSchema = z.object({
    status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"], {
        errorMap: () => ({ message: "Invalid order status" }),
    }),
});

const createPaymentSchema = z.object({
    provider: z.enum(["STRIPE", "RAZORPAY", "PAYPAL"], {
        errorMap: () => ({ message: "Invalid payment provider" }),
    }),
    providerOrderId: z.string().optional(),
    providerPaymentId: z.string().optional(),
    currency: z.string().default("INR"),
    status: z
        .enum(["CREATED", "PENDING", "SUCCESS", "FAILED", "REFUNDED"])
        .default("CREATED"),
});

const updatePaymentStatusSchema = z.object({
    status: z.enum(["CREATED", "PENDING", "SUCCESS", "FAILED", "REFUNDED"], {
        errorMap: () => ({ message: "Invalid payment status" }),
    }),
    providerPaymentId: z.string().optional(),
});

const getOrdersQuerySchema = z.object({
    status: z
        .enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"])
        .optional(),
    limit: z.coerce.number().int().positive().max(100).default(10),
    offset: z.coerce.number().int().min(0).default(0),
});

module.exports = {
    createOrderSchema,
    updateOrderStatusSchema,
    createPaymentSchema,
    updatePaymentStatusSchema,
    getOrdersQuerySchema,
};
