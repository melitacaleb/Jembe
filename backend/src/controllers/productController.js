// src/controllers/productController.js
const Product = require('../models/Product');

const productModel = new Product();

exports.list = async (req, res) => {
  const { category, search } = req.query;
  const limit = Number(req.query.limit) || 30;
  const offset = Number(req.query.offset) || 0;
  const products = await productModel.listMarketplace({ category, search, limit, offset });
  res.json({ products });
};

exports.create = async (req, res) => {
  const { title, description, category, price, currency, quantity, unit, location, media_urls } = req.body;
  if (!title || !category || price === undefined) {
    return res.status(400).json({ error: 'title, category and price are required' });
  }
  const product = await productModel.insert({
    seller_id: req.user.id,
    title, description: description || '', category,
    price, currency: currency || 'KES',
    quantity: quantity || 1, unit: unit || 'unit',
    location: location || '', media_urls: media_urls || [],
  });
  res.status(201).json({ product });
};

exports.mine = async (req, res) => {
  const products = await productModel.getBySeller(req.user.id);
  res.json({ products });
};

exports.update = async (req, res) => {
  const product = await productModel.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.seller_id !== req.user.id) return res.status(403).json({ error: 'Not allowed' });
  const allowed = ['title', 'description', 'price', 'quantity', 'status', 'media_urls', 'location'];
  const data = {};
  for (const key of allowed) if (req.body[key] !== undefined) data[key] = req.body[key];
  data.updated_at = new Date();
  const updated = await productModel.update(req.params.id, data);
  res.json({ product: updated });
};

exports.remove = async (req, res) => {
  const product = await productModel.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.seller_id !== req.user.id) return res.status(403).json({ error: 'Not allowed' });
  await productModel.delete(req.params.id);
  res.json({ ok: true });
};

exports.order = async (req, res) => {
  const product = await productModel.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.status !== 'available') return res.status(400).json({ error: 'Product is not available' });
  if (product.seller_id === req.user.id) return res.status(400).json({ error: 'Cannot order your own product' });

  const quantity = Number(req.body.quantity) || 1;
  const totalPrice = Number(product.price) * quantity;

  const order = await productModel.placeOrder({
    productId: product.id, buyerId: req.user.id, sellerId: product.seller_id,
    quantity, totalPrice,
  });
  res.status(201).json({ order });
};

exports.myOrders = async (req, res) => {
  const orders = await productModel.getOrdersForUser(req.user.id);
  res.json({ orders });
};

exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['accepted', 'declined', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const updated = await productModel.updateOrderStatus(req.params.id, status);
  res.json({ order: updated });
};
