import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Crear un pool de conexiones en lugar de una única conexión
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0
});

// Verificar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
  } catch (error) {
    console.error('Error al conectar a MySQL:', error);
    throw error;
  }
};

testConnection();

export default pool;