const z = require("zod");

const addToCartSchema = z.object({
    productId: z.string().uuid("Invalid product ID"),
    quantity: z.number().int().positive("Quantity must be positive").default(1),
});

const updateCartItemSchema = z.object({
    productId: z.string().uuid("Invalid product ID"),
    quantity: z.number().int().positive("Quantity must be positive"),
});

const removeFromCartSchema = z.object({
    productId: z.string().uuid("Invalid product ID"),
});

module.exports = {
    addToCartSchema,
    updateCartItemSchema,
    removeFromCartSchema,
};
