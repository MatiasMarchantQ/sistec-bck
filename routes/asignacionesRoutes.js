import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js'; // Asegúrate de que la ruta sea correcta
import {
  obtenerAsignaciones,
  obtenerInstitucionesConAsignaciones,
  crearAsignacion,
  actualizarAsignacion,
  eliminarAsignacion,
  obtenerAsignacionesPorEstudiante,
  verificarDisponibilidadCupos
} from '../controllers/asignacionesController.js';

const router = express.Router();

// Obtener todas las asignaciones
router.get('/', verifyToken, obtenerAsignaciones);

router.get('/instituciones-con-asignaciones', verifyToken, obtenerInstitucionesConAsignaciones);

// Crear una nueva asignación
router.post('/', verifyToken, crearAsignacion);

// Actualizar una asignación existente
router.put('/:id', verifyToken, actualizarAsignacion);

// Eliminar (desactivar) una asignación
router.delete('/:id', verifyToken, eliminarAsignacion);

// Obtener asignaciones por estudiante
router.get('/estudiante/:estudiante_id', verifyToken, obtenerAsignacionesPorEstudiante);

// Verificar disponibilidad de cupos en una institución
router.get('/verificar-cupos', verifyToken, verificarDisponibilidadCupos);

export default router;