

const prisma = require( "../../utils/prisma")

exports.createProduct = async (data) => {
  // Enforce backend authority
  // rating should NOT be client-controlled
  const productData = {
    ...data,
    rating: 0,
  };

  // Optional safety check to prevent misconfigured products, even though frontend should handle this
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

exports.getAllProducts = async ({ page, limit, q, category }) =>  {
  const skip = (page - 1) * limit;

  console.log("Querying products with:", { page, limit, q , category});

    const where = {
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
        ],
      }),

      ...(category && {
        category: category,
      }),
    };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        price: true,
        rating: true,
        category: true,
        thumbnail: true,
        images: true,
        stock: true,
        availabilityStatus: true,
      },
    }),
    prisma.product.count({ where })
  ]);

  return {
    products,
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
