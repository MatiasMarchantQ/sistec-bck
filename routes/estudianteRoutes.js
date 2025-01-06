// routes/estudianteRoutes.js
import express from 'express';
import {
  cargarEstudiantes,
  obtenerEstudiantes,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
  actualizarEstudiantesMasivo,
  enviarCredencialesMasivo,
  enviarCredencialIndividual,
  cambiarContrasenaEstudiante,
  enviarCredencialesSeleccionados
} from '../controllers/estudianteController.js';

const router = express.Router();

router.post('/carga-masiva', cargarEstudiantes);
router.get('/', obtenerEstudiantes);
router.post('/', crearEstudiante);
router.put('/edicion-masiva', actualizarEstudiantesMasivo);
router.put('/:id', actualizarEstudiante);
router.delete('/:id', eliminarEstudiante);

router.post('/enviar-credenciales-masivo', enviarCredencialesMasivo);
router.post('/enviar-credenciales-seleccionados', enviarCredencialesSeleccionados);

router.put('/:id/cambiar-contrasena', cambiarContrasenaEstudiante);
router.post('/:id/enviar-credencial', enviarCredencialIndividual);

export default router;