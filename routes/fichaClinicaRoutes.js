import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getFichasClinicasPorInstitucion, createFichaClinicaAdulto, getFichaClinica, updateFichaClinica,
        obtenerFichasClinicas, createFichaClinicaInfantil, getFichaClinicaInfantil, updateFichaClinicaInfantil
 } from '../controllers/fichaClinicaController.js';

const router = Router();
router.get('/', verifyToken, obtenerFichasClinicas);
router.get('/institucion/:institucionId', verifyToken, getFichasClinicasPorInstitucion);
router.get('/:id', verifyToken, getFichaClinica);
router.post('/adulto', verifyToken, createFichaClinicaAdulto);
router.get('/adulto/:id', verifyToken, getFichaClinica);
router.put('/adulto/:id', verifyToken, updateFichaClinica);

router.post('/infantil', verifyToken, createFichaClinicaInfantil);
router.get('/infantil/:id', verifyToken, getFichaClinicaInfantil);
router.put('/infantil/:id', verifyToken, updateFichaClinicaInfantil);

export default router;