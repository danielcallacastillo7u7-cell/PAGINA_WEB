const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'club_catarindo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Prueba de conexión inmediata
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a la BD:', err.message);
        return;
    }
    console.log('Conexión a la base de datos exitosa ✅');
    connection.release();
});

module.exports = pool.promise();