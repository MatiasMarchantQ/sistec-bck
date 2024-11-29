import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import Estudiante from '../models/Estudiante.js';
import dotenv from 'dotenv';
dotenv.config();

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      console.log('Token decodificado completo:', decoded);
    } catch (jwtError) {
      console.error('Error de verificación de token:', jwtError);
      return res.status(401).json({ error: 'Token inválido', details: jwtError.message });
    }
    
    let user;
    try {
      // Búsqueda específica para estudiantes si rol_id es 3
      if (decoded.rol_id === 3) {
        user = await Estudiante.findByPk(decoded.id, {
          attributes: ['id', 'refresh_token', 'rol_id', 'debe_cambiar_contrasena']
        });
        
        console.log('Búsqueda en Estudiante:', {
          id: decoded.id,
          encontrado: !!user
        });
      }

      // Si no se encuentra en Estudiante o no es rol 3, buscar en Usuario
      if (!user) {
        user = await Usuario.findByPk(decoded.id, {
          attributes: ['id', 'refresh_token', 'rol_id', 'debe_cambiar_contrasena']
        });
        
        console.log('Búsqueda en Usuario:', {
          id: decoded.id,
          encontrado: !!user
        });
      }

      // Verificación adicional de existencia de usuario
      if (!user) {
        console.error('Usuario no encontrado:', {
          id: decoded.id,
          rol_id: decoded.rol_id
        });
        return res.status(401).json({ 
          error: 'Usuario no autenticado',
          details: {
            id: decoded.id,
            rol_id: decoded.rol_id
          }
        });
      }

      // Convertir a objeto plano
      const userPlain = user.get({ plain: true });
      
      // Construcción del objeto de usuario para el request
      req.user = {
        id: userPlain.id,
        rol_id: userPlain.rol_id || decoded.rol_id,
        refresh_token: userPlain.refresh_token,
        debe_cambiar_contrasena: Boolean(userPlain.debe_cambiar_contrasena),
        // Asignar estudiante_id solo si rol_id es 3
        estudiante_id: decoded.rol_id === 3 ? userPlain.id : null,
        ...decoded
      };

      console.log('Usuario autenticado:', req.user);
      
      next();
    } catch (dbError) {
      console.error('Error en búsqueda de usuario:', dbError);
      return res.status(500).json({ 
        error: 'Error interno del servidor', 
        details: dbError.message 
      });
    }
  } catch (error) {
    console.error('Error general en verificación de token:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
};