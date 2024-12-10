import express from 'express';
import cors from 'cors';
// import sequelize from './models/index.js';
import { setupAssociations } from './models/associations.js';
import authRoutes from './routes/authRoutes.js';
import personalRoutes from './routes/personalRoutes.js';
import estudianteRoutes from './routes/estudianteRoutes.js';
import obtenerRoutes from './routes/obtenerRoutes.js';
import institucionRoutes from './routes/institucionRoutes.js';
import asignacionesRoutes from './routes/asignacionesRoutes.js';
import fichaClinicaRoutes from './routes/fichaClinicaRoutes.js';
import seguimientosRoutes from './routes/seguimientosRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';

// Crear la instancia de express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/obtener', obtenerRoutes);
app.use('/api/instituciones', institucionRoutes);
app.use('/api/asignaciones', asignacionesRoutes);
app.use('/api/fichas-clinicas', fichaClinicaRoutes);
app.use('/api/seguimientos', seguimientosRoutes);
app.use('/api/reportes', reportesRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo salió mal!',
    message: err.message 
  });
});

// Sincronizar la base de datos y configurar asociaciones
const startServer = async () => {
  try {
    setupAssociations();
    app.listen(5000, () => {
      console.log('Server corriendo en el puerto 5000');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
};

startServer();