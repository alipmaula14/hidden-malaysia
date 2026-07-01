const mysql = require('mysql2/promise');
require('dotenv').config();


const isRailway = !!process.env.MYSQLHOST;

const dbConfig = isRailway
  ? {
      host:     process.env.MYSQLHOST,
      port:     Number(process.env.MYSQLPORT || 3306),
      user:     process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
    }
  : {
      host:     process.env.DB_HOST || 'localhost',
      port:     Number(process.env.DB_PORT || 3306),
      user:     process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'hidden_malaysia',
    };

console.log(
  `[DB] ${isRailway ? 'Railway' : 'Local'} MySQL → ` +
  `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
);

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 20,
});

pool.getConnection()
  .then(conn => {
    console.log('[DB] Connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] Connection failed:', err.message);
    if (!isRailway) {
      console.error('[DB] Check your .env DB_* settings and make sure MySQL is running.');
    } else {
      console.error('[DB] Check that the Railway MySQL plugin is attached to this service.');
    }
  });

pool.on('error', (err) => {
  console.error('[DB-POOL]', err.code, err.message);
});

module.exports = pool;
