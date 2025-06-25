import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { 
  createPacienteDependencia,
  createVisitaDomiciliaria,
  getVisitasDomiciliarias,
  updateVisitaDomiciliaria,
  createSeguimientoDependencia,
  getSeguimientosByPaciente,
  updateSeguimientoDependencia,
  deleteSeguimientoDependencia,
  updatePacienteDependencia
} from '../controllers/PacienteDependenciaController.js';

const router = express.Router();

// Rutas para pacientes con dependencia
router.post('/', verifyToken, createPacienteDependencia); // POST /api/paciente-dependencia/
router.put('/:id', verifyToken, updatePacienteDependencia); // PUT /api/p
router.post('/visitas', verifyToken, createVisitaDomiciliaria); // POST /api/paciente-dependencia/:id/visitas
router.get('/:paciente_dependencia_id', getVisitasDomiciliarias);
router.put('/visitas/:paciente_dependencia_id', verifyToken, updateVisitaDomiciliaria);

// Rutas para seguimientos de dependencia
router.post('/seguimiento', verifyToken, createSeguimientoDependencia);
router.get('/seguimiento/paciente/:paciente_id', getSeguimientosByPaciente);
router.put('/seguimiento/:id', verifyToken, updateSeguimientoDependencia);
router.delete('/seguimiento/:id', verifyToken, deleteSeguimientoDependencia);

export default router;