// DEPRECATED: This file is kept for reference only.
// The project now uses Sequelize ORM instead of raw pg queries.
// See apps/api/src/database/sequelize.ts for the current connection setup.

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: (string | number | null | boolean)[]) => {
  return pool.query(text, params);
};

export const getClient = async () => {
  return await pool.connect();
};

export default pool;
