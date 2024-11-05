// routes/obtenerRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  obtenerRoles,
  obtenerTiposInstituciones,
  obtenerInstitucionesPorTipo,
  obtenerReceptoresPorInstitucion
} from '../controllers/obtenerController.js';

const router = express.Router();

router.get('/roles', verifyToken, obtenerRoles);
router.get('/tipos-instituciones', verifyToken, obtenerTiposInstituciones);
router.get('/instituciones', obtenerInstitucionesPorTipo);
router.get('/receptores', obtenerReceptoresPorInstitucion);

// router.get('/usuarios-por-rol/:rolId', verifyToken, obtenerUsuariosPorRol);
// router.get('/estadisticas', verifyToken, obtenerEstadisticas);

export default router;