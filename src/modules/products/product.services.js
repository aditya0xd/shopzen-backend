const prisma = require('../../utils/prisma');

const createProduct = async (data) => {
  return prisma.product.create({
    data
  });
};

const getAllProducts = async () => {
  return prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

const getProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id }
  });
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById
};
