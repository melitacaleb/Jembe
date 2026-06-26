// src/db/migrate.js
// Usage: npm run migrate  (applies schema.sql to the configured DATABASE_URL)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'schema.sql'), 'utf8');
  const client = await pool.connect();
  try {
    console.log('[migrate] Applying schema.sql ...');
    await client.query(sql);
    console.log('[migrate] Done.');
  } catch (err) {
    console.error('[migrate] Failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
