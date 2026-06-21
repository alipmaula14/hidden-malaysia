const mysql = require('mysql2/promise');
require('dotenv').config();

// A connection pool reuses existing database connections instead of
// opening a brand-new one for every query — much faster under load.
const pool = mysql.createPool({
  // Railway MySQL plugin injects MYSQL* vars; fall back to DB_* for local dev
  host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.MYSQLPORT || process.env.DB_PORT  || 3306),
  user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASS     || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'hidden_malaysia',
  waitForConnections: true,
  connectionLimit: 10,  // max simultaneous DB connections
  queueLimit: 20        // reject gracefully once 20 requests are already waiting
});

// Verify the database is reachable when the server starts
pool.getConnection()
  .then(conn => {
    console.log('MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL connection failed:', err.message);
    console.error('Check your .env DB_* settings and make sure MySQL is running.');
  });

// Surface pool exhaustion errors so callers can return 503 instead of 500
pool.on('error', (err) => {
  console.error('[DB-POOL]', err.code, err.message);
});

module.exports = pool;
