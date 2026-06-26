// src/models/Course.js
const BaseModel = require('./BaseModel');
const pool = require('../db/pool');

class Course extends BaseModel {
  constructor() {
    super('courses');
  }

  async listPublished({ category = null, limit = 30, offset = 0 } = {}) {
    const conditions = ['c.is_published = true'];
    const params = [];
    if (category) {
      params.push(category);
      conditions.push(`c.category = $${params.length}`);
    }
    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT c.*, u.full_name AS provider_name, u.avatar_url AS provider_avatar, u.org_category
       FROM courses c JOIN users u ON u.id = c.provider_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rows;
  }

  async getByProvider(providerId) {
    const { rows } = await pool.query('SELECT * FROM courses WHERE provider_id = $1 ORDER BY created_at DESC', [providerId]);
    return rows;
  }

  async enroll(courseId, userId) {
    const { rows } = await pool.query(
      `INSERT INTO course_enrollments (course_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING *`,
      [courseId, userId]
    );
    return rows[0] || null;
  }

  async getEnrollmentsForUser(userId) {
    const { rows } = await pool.query(
      `SELECT ce.*, c.title, c.cover_url, c.category, u.full_name AS provider_name
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       JOIN users u ON u.id = c.provider_id
       WHERE ce.user_id = $1 ORDER BY ce.enrolled_at DESC`,
      [userId]
    );
    return rows;
  }

  async updateProgress(courseId, userId, progress) {
    const { rows } = await pool.query(
      'UPDATE course_enrollments SET progress = $1 WHERE course_id = $2 AND user_id = $3 RETURNING *',
      [progress, courseId, userId]
    );
    return rows[0] || null;
  }
}

module.exports = Course;
