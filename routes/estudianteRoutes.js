// routes/estudianteRoutes.js
import express from 'express';
import {
  cargarEstudiantes,
  obtenerEstudiantes,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
  actualizarEstudiantesMasivo
} from '../controllers/estudianteController.js';

const router = express.Router();

router.post('/carga-masiva', cargarEstudiantes);
router.get('/', obtenerEstudiantes);
router.post('/', crearEstudiante);
router.put('/edicion-masiva', actualizarEstudiantesMasivo);
router.put('/:id', actualizarEstudiante);
router.delete('/:id', eliminarEstudiante);

export default router;