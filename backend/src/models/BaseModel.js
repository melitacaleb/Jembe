// src/models/BaseModel.js
// Abstract base class. Every domain model (User, Post, Product, Course...)
// extends this to inherit shared CRUD behaviour, keeping the codebase DRY
// and consistently object-oriented.
const pool = require('../db/pool');

class BaseModel {
  /** @param {string} table  Underlying Postgres table name */
  constructor(table) {
    if (this.constructor === BaseModel) {
      throw new Error('BaseModel is abstract and cannot be instantiated directly');
    }
    this.table = table;
  }

  async findById(id) {
    const { rows } = await pool.query(`SELECT * FROM ${this.table} WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  async findAll({ where = '', params = [], orderBy = 'created_at DESC', limit = 50, offset = 0 } = {}) {
    const clause = where ? `WHERE ${where}` : '';
    const query = `SELECT * FROM ${this.table} ${clause} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const { rows } = await pool.query(query, [...params, limit, offset]);
    return rows;
  }

  async insert(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const columns = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO ${this.table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return rows[0];
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE ${this.table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await pool.query(`DELETE FROM ${this.table} WHERE id = $1`, [id]);
    return rowCount > 0;
  }

  async raw(query, params = []) {
    const { rows } = await pool.query(query, params);
    return rows;
  }
}

module.exports = BaseModel;
