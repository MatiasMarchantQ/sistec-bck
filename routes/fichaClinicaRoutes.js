import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getFichasClinicasPorInstitucion, createFichaClinicaAdulto, getFichaClinica, updateFichaClinica } from '../controllers/fichaClinicaController.js';

const router = Router();

router.get('/institucion/:institucionId', verifyToken, getFichasClinicasPorInstitucion);
router.get('/:id', verifyToken, getFichaClinica);
router.post('/adulto', verifyToken, createFichaClinicaAdulto);
router.get('/adulto/:id', verifyToken, getFichaClinica);
router.put('/adulto/:id', verifyToken, updateFichaClinica);

export default router;