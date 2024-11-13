// src/routes/authRoutes.js
import express from 'express';
import { 
  obtenerUsuarios, 
  obtenerUsuarioPorId, 
  crearUsuario, 
  login, 
  refreshToken,
  logout,
  cambiarContrasena,
  actualizarUsuario,
  getMe,
  solicitarRecuperacionContrasena,
  restablecerContrasena
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas de autenticación
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', verifyToken, logout);
router.post('/cambiar-contrasena', verifyToken, cambiarContrasena);

// Rutas de usuarios
router.get('/usuarios', verifyToken, obtenerUsuarios);
router.get('/usuarios/:id', verifyToken, obtenerUsuarioPorId);
router.post('/usuarios', verifyToken, crearUsuario);

router.get('/me', verifyToken, getMe);

router.put('/usuarios/:id', verifyToken, actualizarUsuario);

// Rutas públicas para recuperación de contraseña
router.post('/recuperar-contrasena', solicitarRecuperacionContrasena);
router.post('/restablecer-contrasena', restablecerContrasena);

export default router;