const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Manejar errores sin crashear el servidor
pool.on('error', (err) => {
    console.error('Conexión perdida, reconectando...', err.message);
});

pool.connect()
    .then(client => {
        console.log('Conexión a Neon PostgreSQL exitosa ✅');
        client.release();
    })
    .catch(err => {
        console.error('Error conectando a la BD:', err.message);
    });

module.exports = pool;