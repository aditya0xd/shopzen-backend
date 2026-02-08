const prisma = require("../../utils/prisma");

/**
 * Get or create cart for a user
 */
const getOrCreateCart = async (userId) => {
    let cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    return cart;
};

/**
 * Get user's cart
 */
const getCart = async (userId) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            title: true,
                            price: true,
                            discountPercentage: true,
                            thumbnail: true,
                            stock: true,
                            availabilityStatus: true,
                        },
                    },
                },
            },
        },
    });

    if (!cart) {
        return {
            id: null,
            userId,
            items: [],
            totalItems: 0,
            totalPrice: 0,
        };
    }

    // Calculate totals
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce((sum, item) => {
        const price = item.product.price;
        const discount = item.product.discountPercentage || 0;
        const finalPrice = price - (price * discount) / 100;
        return sum + finalPrice * item.quantity;
    }, 0);

    return {
        ...cart,
        totalItems,
        totalPrice: parseFloat(totalPrice.toFixed(2)),
    };
};

/**
 * Add item to cart
 */
const addToCart = async (userId, productId, quantity = 1) => {
    // Verify product exists and has stock
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
    }

    if (product.stock < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
        where: {
            cartId_productId: {
                cartId: cart.id,
                productId,
            },
        },
    });

    let cartItem;

    if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;

        if (product.stock < newQuantity) {
            throw new Error("INSUFFICIENT_STOCK");
        }

        cartItem = await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
            include: {
                product: true,
            },
        });
    } else {
        // Create new cart item
        cartItem = await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                quantity,
            },
            include: {
                product: true,
            },
        });
    }

    return cartItem;
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (userId, productId, quantity) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
    });

    if (!cart) {
        throw new Error("CART_NOT_FOUND");
    }

    // Verify product stock
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
    }

    if (product.stock < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
    }

    // Update cart item
    const cartItem = await prisma.cartItem.update({
        where: {
            cartId_productId: {
                cartId: cart.id,
                productId,
            },
        },
        data: { quantity },
        include: {
            product: true,
        },
    });

    return cartItem;
};

/**
 * Remove item from cart
 */
const removeFromCart = async (userId, productId) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
    });

    if (!cart) {
        throw new Error("CART_NOT_FOUND");
    }

    await prisma.cartItem.delete({
        where: {
            cartId_productId: {
                cartId: cart.id,
                productId,
            },
        },
    });

    return { message: "Item removed from cart" };
};

/**
 * Clear entire cart
 */
const clearCart = async (userId) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
    });

    if (!cart) {
        throw new Error("CART_NOT_FOUND");
    }

    await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
    });

    return { message: "Cart cleared" };
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
};
