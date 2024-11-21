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
  cambiarContrasenaEstudiante
} from '../controllers/estudianteController.js';

const router = express.Router();

router.post('/carga-masiva', cargarEstudiantes);
router.get('/', obtenerEstudiantes);
router.post('/', crearEstudiante);
router.put('/edicion-masiva', actualizarEstudiantesMasivo);
router.put('/:id', actualizarEstudiante);
router.delete('/:id', eliminarEstudiante);

router.post('/enviar-credenciales-masivo', enviarCredencialesMasivo);

// En estudianteRoutes.js
router.put('/:id/cambiar-contrasena', cambiarContrasenaEstudiante);
router.post('/:id/enviar-credencial', enviarCredencialIndividual);

export default router;