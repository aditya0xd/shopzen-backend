const {
  createProduct,
  getAllProducts,
  getProductById
} = require('./product.services');

const create = async (req, res) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getAll = async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const products = await getAllProducts({page, limit});
  res.json(products);
};

const getOne = async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
};

module.exports = {
  create,
  getAll,
  getOne
};


