// routes/reportesRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { 
  obtenerDatosDashboard
} from '../controllers/reportesController.js';

const router = express.Router();

//Rutas de dashboard
router.get('/dashboard', obtenerDatosDashboard);

export default router;