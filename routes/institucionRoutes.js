// routes/institucionesRoutes.js
import express from 'express';
import institucionesController from '../controllers/institucionesController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta para obtener todas las instituciones (con paginación y filtros)
router.get('/', verifyToken, institucionesController.obtenerInstituciones);

// Ruta para crear una nueva institución
router.post('/', verifyToken, institucionesController.crearInstitucion);

// Ruta para actualizar una institución existente
router.put('/:id', verifyToken, institucionesController.actualizarInstitucion);

// Rutas de receptores (dentro del mismo controlador)
router.post('/:institucion_id/receptores', verifyToken, institucionesController.agregarReceptor);
router.put('/receptores/:receptor_id', verifyToken, institucionesController.actualizarReceptor);
router.delete('/receptores/:receptor_id', verifyToken, institucionesController.eliminarReceptor);

export default router;