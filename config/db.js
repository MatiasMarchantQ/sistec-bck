import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false,
    pool: {
      max: 50,
      min: 0,
      acquire: 60000,
      idle: 10000,
      evict: 1000,
      handleDisconnects: true
    },
    retry: {
      max: 3,
      timeout: 20000,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeConnectionAcquireTimeoutError/
      ]
    }
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    throw error;
  }
}

testConnection();

async function handleReconnect() {
  let connected = false;
  while (!connected) {
    try {
      await sequelize.authenticate();
      connected = true;
      console.log('Reconexión exitosa a la base de datos.');
    } catch (err) {
      console.error('Intentando reconectar...', err.message);
      await new Promise(res => setTimeout(res, 5000)); // Espera 5 segundos antes de reintentar
    }
  }
}


export default sequelize;