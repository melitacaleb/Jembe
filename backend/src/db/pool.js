// src/db/pool.js
// Single shared Postgres connection pool (Neon-compatible, uses SSL).
require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('[db] WARNING: DATABASE_URL is not set. Set it in your .env or Render environment variables.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Neon
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err);
});

module.exports = pool;
