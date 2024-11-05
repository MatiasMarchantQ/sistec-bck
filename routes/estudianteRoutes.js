// routes/estudianteRoutes.js
import express from 'express';
import {
  cargarEstudiantes,
  obtenerEstudiantes,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante
} from '../controllers/estudianteController.js';

const router = express.Router();

router.post('/carga-masiva', cargarEstudiantes);
router.get('/', obtenerEstudiantes);
router.post('/', crearEstudiante);
router.put('/:id', actualizarEstudiante);
router.delete('/:id', eliminarEstudiante);

export default router;