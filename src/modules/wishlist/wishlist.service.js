const prisma = require("../../utils/prisma");

/**
 * Get wishlist for a user
 * @param {string} userId
 */
const getWishlist = async (userId) => {
    const wishlist = await prisma.wishlist.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true // Include product details
                },
                orderBy: { addedAt: 'desc' }
            }
        }
    });

    if (!wishlist) {
        // Return empty structure if no wishlist exists yet
        return { items: [] };
    }

    return wishlist;
};

/**
 * Add product to wishlist
 * @param {string} userId
 * @param {string} productId
 */
const addToWishlist = async (userId, productId) => {
    // Check if product exists
    const product = await prisma.product.findUnique({
        where: { id: productId }
    });

    if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
    }

    // Get or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
        where: { userId }
    });

    if (!wishlist) {
        wishlist = await prisma.wishlist.create({
            data: { userId }
        });
    }

    // Check if item already in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
        where: {
            wishlistId_productId: {
                wishlistId: wishlist.id,
                productId: productId
            }
        }
    });

    if (existingItem) {
        return existingItem; // It's already there
    }

    const newItem = await prisma.wishlistItem.create({
        data: {
            wishlistId: wishlist.id,
            productId: productId
        },
        include: { product: true }
    });

    return newItem;
};

/**
 * Remove product from wishlist
 * @param {string} userId
 * @param {string} productId
 */
const removeFromWishlist = async (userId, productId) => {
    const wishlist = await prisma.wishlist.findUnique({
        where: { userId }
    });

    if (!wishlist) {
        throw new Error('WISHLIST_NOT_FOUND');
    }

    try {
        await prisma.wishlistItem.delete({
            where: {
                wishlistId_productId: {
                    wishlistId: wishlist.id,
                    productId: productId
                }
            }
        });
    } catch (error) {
        // If item not found, just ignore
        if (error.code === 'P2025') {
            throw new Error('ITEM_NOT_IN_WISHLIST');
        }
        throw error;
    }

    return { message: 'Item removed from wishlist' };
};

/**
 * Move item from wishlist to cart
 * @param {string} userId
 * @param {string} productId
 */
const moveToCart = async (userId, productId) => {
    // 1. Add to cart (using cart service logic, recreated here simpler or import)
    // We'll reimplement simple add to cart logic here to avoid circular dep if cart service uses wishlist
    // Or just assume basic cart logic.

    // Check product
    const product = await prisma.product.findUnique({
        where: { id: productId }
    });
    if (!product) throw new Error('PRODUCT_NOT_FOUND');

    // Get/Create Cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
        cart = await prisma.cart.create({ data: { userId } });
    }

    // Upsert Cart Item
    await prisma.cartItem.upsert({
        where: {
            cartId_productId: {
                cartId: cart.id,
                productId: productId
            }
        },
        update: {
            quantity: { increment: 1 }
        },
        create: {
            cartId: cart.id,
            productId: productId,
            quantity: 1
        }
    });

    // 2. Remove from wishlist
    await removeFromWishlist(userId, productId).catch(err => {
        // Ignore if not in wishlist, but logged
        console.log("Item was not in wishlist, but added to cart anyway.");
    });

    return { message: 'Moved to cart' };
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    moveToCart
};
