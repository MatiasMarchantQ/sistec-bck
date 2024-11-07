// routes/obtenerRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  obtenerRoles,
  obtenerTiposInstituciones,
  obtenerInstitucionesPorTipo,
  obtenerReceptoresPorInstitucion,
  obtenerNivelesEscolaridad,
  obtenerCiclosVitalesFamiliares,
  obtenerTiposFamilia
} from '../controllers/obtenerController.js';

const router = express.Router();

router.get('/roles', verifyToken, obtenerRoles);
router.get('/tipos-instituciones', verifyToken, obtenerTiposInstituciones);
router.get('/instituciones', verifyToken, obtenerInstitucionesPorTipo);
router.get('/receptores', verifyToken, obtenerReceptoresPorInstitucion);
router.get('/niveles-escolaridad', verifyToken, obtenerNivelesEscolaridad);
router.get('/ciclos-vitales-familiares', verifyToken, obtenerCiclosVitalesFamiliares);
router.get('/tipos-familia', verifyToken, obtenerTiposFamilia);


export default router;