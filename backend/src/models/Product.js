// src/models/Product.js
const BaseModel = require('./BaseModel');
const pool = require('../db/pool');

class Product extends BaseModel {
  constructor() {
    super('products');
  }

  async listMarketplace({ category = null, search = null, limit = 30, offset = 0 } = {}) {
    const conditions = [`status = 'available'`];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT p.*, u.username, u.full_name, u.account_type, u.avatar_url
       FROM products p JOIN users u ON u.id = p.seller_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rows;
  }

  async getBySeller(sellerId) {
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
      [sellerId]
    );
    return rows;
  }

  async placeOrder({ productId, buyerId, sellerId, quantity, totalPrice }) {
    const { rows } = await pool.query(
      `INSERT INTO orders (product_id, buyer_id, seller_id, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [productId, buyerId, sellerId, quantity, totalPrice]
    );
    return rows[0];
  }

  async getOrdersForUser(userId) {
    const { rows } = await pool.query(
      `SELECT o.*, p.title, p.media_urls,
              buyer.username AS buyer_username, seller.username AS seller_username
       FROM orders o
       JOIN products p ON p.id = o.product_id
       JOIN users buyer ON buyer.id = o.buyer_id
       JOIN users seller ON seller.id = o.seller_id
       WHERE o.buyer_id = $1 OR o.seller_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return rows;
  }

  async updateOrderStatus(orderId, status) {
    const { rows } = await pool.query(
      'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [status, orderId]
    );
    return rows[0] || null;
  }
}

module.exports = Product;
