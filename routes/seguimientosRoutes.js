// routes/seguimientoRoutes.js
import express from 'express';
import { 
  crearSeguimientoInfantil, 
  obtenerSeguimientosInfantiles,
  obtenerSeguimientoInfantilPorId,
//   crearSeguimientoAdulto,
//   obtenerSeguimientosAdulto
} from '../controllers/seguimientosController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas de seguimiento infantil
router.post('/infantil', verifyToken, crearSeguimientoInfantil);
router.get('/infantil/:pacienteId', verifyToken, obtenerSeguimientosInfantiles);
router.get('/infantil/:id', verifyToken, obtenerSeguimientoInfantilPorId);

// Rutas de seguimiento de adulto (preparadas para implementación futura)
// router.post('/adulto', verifyToken, crearSeguimientoAdulto);
// router.get('/adulto/:pacienteId', verifyToken, obtenerSeguimientosAdulto);

export default router;