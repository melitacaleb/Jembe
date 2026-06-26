// src/models/Post.js
const BaseModel = require('./BaseModel');
const pool = require('../db/pool');

class Post extends BaseModel {
  constructor() {
    super('posts');
  }

  /** Feed enriched with author info, like count and whether viewer liked it */
  async getFeedForUser(viewerId, { limit = 20, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT p.*, u.username, u.full_name, u.avatar_url, u.account_type,
              (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
              EXISTS(SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = p.id AND pl2.user_id = $1) AS liked_by_viewer
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.author_id = $1
          OR p.author_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
          OR true -- public feed fallback so new accounts still see content
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [viewerId, limit, offset]
    );
    return rows;
  }

  async getByAuthor(authorId, { limit = 30, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p WHERE author_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [authorId, limit, offset]
    );
    return rows;
  }

  async like(postId, userId) {
    const { rows } = await pool.query(
      `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
      [postId, userId]
    );
    return rows[0] || null;
  }

  async unlike(postId, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    return rowCount > 0;
  }

  async addComment(postId, authorId, body) {
    const { rows } = await pool.query(
      `INSERT INTO comments (post_id, author_id, body) VALUES ($1, $2, $3) RETURNING *`,
      [postId, authorId, body]
    );
    return rows[0];
  }

  async getComments(postId) {
    const { rows } = await pool.query(
      `SELECT c.*, u.username, u.avatar_url FROM comments c
       JOIN users u ON u.id = c.author_id WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
      [postId]
    );
    return rows;
  }
}

module.exports = Post;
