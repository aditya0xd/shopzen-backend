const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    moveToCart
} = require('./wishlist.service');

const get = async (req, res) => {
    try {
        const userId = req.user.id;
        const wishlist = await getWishlist(userId);
        res.status(200).json(wishlist);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const add = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const item = await addToWishlist(userId, productId);
        res.status(201).json(item);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Item already in wishlist' });
        }
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const remove = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        await removeFromWishlist(userId, productId);
        res.status(200).json({ message: 'Item removed from wishlist' });
    } catch (error) {
        if (error.message === 'WISHLIST_NOT_FOUND' || error.message === 'ITEM_NOT_IN_WISHLIST') {
            return res.status(404).json({ message: 'Item not found in wishlist' });
        }
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const move = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body; // Or params? Usually separate endpoint.

        // We can expose as POST /move or special action on existing item
        // Let's use POST /move-to-cart
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        await moveToCart(userId, productId);
        res.status(200).json({ message: 'Item moved to cart' });
    } catch (error) {
        console.error('Error moving optional item to cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    get,
    add,
    remove,
    move
};
