// routes/personalRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  obtenerPersonal,
  crearPersonal,
  actualizarPersonal,
  eliminarPersonal,
  obtenerPersonalPorId
} from '../controllers/personalController.js';

const router = express.Router();

router.get('/', verifyToken, obtenerPersonal);
router.post('/', verifyToken, crearPersonal);
router.put('/:id', verifyToken, actualizarPersonal);
router.delete('/:id', verifyToken, eliminarPersonal);
router.get('/:id', verifyToken, obtenerPersonalPorId);

export default router;