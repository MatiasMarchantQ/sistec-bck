// routes/seguimientoRoutes.js
import express from 'express';
import { 
  crearSeguimientoInfantil, 
  obtenerSeguimientosInfantiles,
  obtenerSeguimientoInfantilPorId,
  crearSeguimientoAdulto, 
  obtenerSeguimientosAdulto,
  obtenerSeguimientoAdultoPorId
} from '../controllers/seguimientosController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas de seguimiento infantil
router.post('/infantil', verifyToken, crearSeguimientoInfantil);
router.get('/infantil/:pacienteId', verifyToken, obtenerSeguimientosInfantiles);
router.get('/infantil/:id', verifyToken, obtenerSeguimientoInfantilPorId);

// Rutas de seguimiento de adulto
router.post('/adulto', verifyToken, crearSeguimientoAdulto);
router.get('/adulto/:pacienteId', verifyToken, obtenerSeguimientosAdulto);
router.get('/adulto/:id/paciente/:pacienteId', verifyToken, obtenerSeguimientoAdultoPorId);

export default router;