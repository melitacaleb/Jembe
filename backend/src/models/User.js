// src/models/User.js
const bcrypt = require('bcryptjs');
const BaseModel = require('./BaseModel');
const pool = require('../db/pool');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  static async hashPassword(plain) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  static async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  }

  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  }

  async findByUsername(username) {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0] || null;
  }

  /** Strip sensitive fields before sending to client */
  static toPublic(user) {
    if (!user) return null;
    const { password_hash, ...safe } = user;
    return safe;
  }

  /**
   * isOrganization() encapsulates the behavioural difference between
   * an individual farmer and an organization account (NGO, co-op, gov body...).
   * Other parts of the app (e.g. course creation) check this instead of
   * scattering account_type string comparisons everywhere.
   */
  static isOrganization(user) {
    return user.account_type === 'organization';
  }

  async follow(followerId, followingId) {
    if (followerId === followingId) throw new Error('Cannot follow yourself');
    const { rows } = await pool.query(
      `INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING *`,
      [followerId, followingId]
    );
    return rows[0] || null;
  }

  async unfollow(followerId, followingId) {
    const { rowCount } = await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    return rowCount > 0;
  }

  async getFollowCounts(userId) {
    const { rows } = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) AS followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) AS following`,
      [userId]
    );
    return { followers: Number(rows[0].followers), following: Number(rows[0].following) };
  }

  async search(term, limit = 20) {
    const { rows } = await pool.query(
      `SELECT id, username, full_name, account_type, avatar_url, location
       FROM users WHERE username ILIKE $1 OR full_name ILIKE $1 LIMIT $2`,
      [`%${term}%`, limit]
    );
    return rows;
  }
}

module.exports = User;
