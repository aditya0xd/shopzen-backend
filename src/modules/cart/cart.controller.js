const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
} = require("./cart.service");
const {
    addToCartSchema,
    updateCartItemSchema,
    removeFromCartSchema,
} = require("./cart.schema");

/**
 * Get user's cart
 * GET /api/v1/cart
 */
const getUserCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cart = await getCart(userId);
        res.status(200).json(cart);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Failed to fetch cart" });
    }
};

/**
 * Add item to cart
 * POST /api/v1/cart/items
 */
const addItemToCart = async (req, res) => {
    const valid = addToCartSchema.safeParse(req.body);
    console.log(valid)
    if (!valid.success) {
        return res.status(400).json({
            message: "Invalid request data",
            errors: valid.error.errors,
        });
    }

    const { productId, quantity } = valid.data;
    const userId = req.user.userId;

    try {
        const cartItem = await addToCart(userId, productId, quantity);
        res.status(201).json({
            message: "Item added to cart",
            cartItem,
        });
    } catch (err) {
        console.error(err.message);

        if (err.message === "PRODUCT_NOT_FOUND") {
            return res.status(404).json({ message: "Product not found" });
        }

        if (err.message === "INSUFFICIENT_STOCK") {
            return res.status(400).json({ message: "Insufficient stock" });
        }

        res.status(500).json({ message: "Failed to add item to cart" });
    }
};

/**
 * Update cart item quantity
 * PUT /api/v1/cart/items
 */
const updateCartItemQuantity = async (req, res) => {
    const valid = updateCartItemSchema.safeParse(req.body);

    if (!valid.success) {
        return res.status(400).json({
            message: "Invalid request data",
            errors: valid.error.errors,
        });
    }

    const { productId, quantity } = valid.data;
    const userId = req.user.userId;

    try {
        const cartItem = await updateCartItem(userId, productId, quantity);
        res.status(200).json({
            message: "Cart item updated",
            cartItem,
        });
    } catch (err) {
        console.error(err.message);

        if (err.message === "CART_NOT_FOUND") {
            return res.status(404).json({ message: "Cart not found" });
        }

        if (err.message === "PRODUCT_NOT_FOUND") {
            return res.status(404).json({ message: "Product not found" });
        }

        if (err.message === "INSUFFICIENT_STOCK") {
            return res.status(400).json({ message: "Insufficient stock" });
        }

        res.status(500).json({ message: "Failed to update cart item" });
    }
};

/**
 * Remove item from cart
 * DELETE /api/v1/cart/items
 */
const removeItemFromCart = async (req, res) => {
    const valid = removeFromCartSchema.safeParse(req.body);

    if (!valid.success) {
        return res.status(400).json({
            message: "Invalid request data",
            errors: valid.error.errors,
        });
    }

    const { productId } = valid.data;
    const userId = req.user.userId;

    try {
        const result = await removeFromCart(userId, productId);
        res.status(200).json(result);
    } catch (err) {
        console.error(err.message);

        if (err.message === "CART_NOT_FOUND") {
            return res.status(404).json({ message: "Cart not found" });
        }

        res.status(500).json({ message: "Failed to remove item from cart" });
    }
};

/**
 * Clear entire cart
 * DELETE /api/v1/cart
 */
const clearUserCart = async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await clearCart(userId);
        res.status(200).json(result);
    } catch (err) {
        console.error(err.message);

        if (err.message === "CART_NOT_FOUND") {
            return res.status(404).json({ message: "Cart not found" });
        }

        res.status(500).json({ message: "Failed to clear cart" });
    }
};

module.exports = {
    getUserCart,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearUserCart,
};
