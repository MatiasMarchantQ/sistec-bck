import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { 
    getFichasClinicasPorInstitucion, 
    createFichaClinicaAdulto, 
    getFichaClinica, 
    updateFichaClinicaAdulto, // Actualización de ficha clínica adulto
    obtenerFichasClinicas, 
    createFichaClinicaInfantil, 
    getFichaClinicaInfantil, 
    updateFichaClinicaInfantil, // Actualización de ficha clínica infantil
    getReevaluaciones, 
    updateReevaluacion, // Actualización de reevaluación
    updateReevaluacionInfantil
} from '../controllers/fichaClinicaController.js';

const router = Router();

// Rutas para obtener fichas clínicas
router.get('/', verifyToken, obtenerFichasClinicas);
router.get('/institucion/:institucionId', verifyToken, getFichasClinicasPorInstitucion);
router.get('/:id', verifyToken, getFichaClinica);

// Rutas para manejar fichas clínicas de adultos
router.post('/adulto', verifyToken, createFichaClinicaAdulto);
router.get('/adulto/:id', verifyToken, getFichaClinica);
router.put('/adulto/:id', verifyToken, updateFichaClinicaAdulto); // Ruta para actualizar ficha clínica adulto

// Rutas para manejar fichas clínicas de infantiles
router.post('/infantil', verifyToken, createFichaClinicaInfantil);
router.get('/infantil/:id', verifyToken, getFichaClinicaInfantil);
router.put('/infantil/:id', verifyToken, updateFichaClinicaInfantil); // Ruta para actualizar ficha clínica infantil

// Rutas para reevaluaciones
router.get('/reevaluaciones/:id', verifyToken, getReevaluaciones);
router.put('/reevaluaciones/:id', verifyToken, updateReevaluacion);
router.put('/reevaluaciones-infantil/:id', updateReevaluacionInfantil);

export default router;