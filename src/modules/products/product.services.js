// const prisma = require('../../utils/prisma');

// const createProduct = async (data) => {
//   return prisma.product.create({
//     data
//   });
// };

// const getAllProducts = async () => {
//   return prisma.product.findMany({
//     orderBy: { createdAt: 'desc' }
//   });
// };

// const getProductById = async (id) => {
//   return prisma.product.findUnique({
//     where: { id }
//   });
// };

// module.exports = {
//   createProduct,
//   getAllProducts,
//   getProductById
// };


//
const prisma = require("../../utils/prisma");

exports.createProduct = async (data) => {
  // Enforce backend authority
  // rating should NOT be client-controlled
  const productData = {
    ...data,
    rating: 0,
  };

  // Optional safety check (good practice even without validation)
  if (productData.stock < productData.minimumOrderQuantity) {
    const error = new Error(
      "Stock cannot be less than minimum order quantity"
    );
    error.statusCode = 400;
    throw error;
  }

  try {
    const product = await prisma.product.create({
      data: productData,
    });

    return product;
  } catch (err) {
    // SKU unique constraint
    if (err.code === "P2002") {
      const error = new Error("SKU already exists");
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }
};

exports.getAllProducts = async ({ page, limit }) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        price: true,
        thumbnail: true,
        stock: true,
        availabilityStatus: true,
      },
    }),
    prisma.product.count(),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      hasNext: skip + limit < total,
    },
  };
};

exports.getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return product;
};
