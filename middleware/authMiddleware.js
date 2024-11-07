import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import Estudiante from '../models/Estudiante.js';

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
    } catch (jwtError) {
      console.log('Error al verificar el token:', jwtError.message);
      return res.status(401).json({ error: 'Token inválido', details: jwtError.message });
    }
    
    try {
      let user;
      if (decoded.estudiante_id) {
        // Usar el modelo Estudiante en lugar de consulta SQL directa
        user = await Estudiante.findOne({
          where: { id: decoded.estudiante_id },
          attributes: ['id', 'refresh_token', 'rol_id', 'debe_cambiar_contrasena']
        });
      } else {
        // Usar el modelo Usuario en lugar de consulta SQL directa
        user = await Usuario.findOne({
          where: { id: decoded.id },
          attributes: ['id', 'refresh_token', 'rol_id', 'debe_cambiar_contrasena']
        });
      }

      if (!user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Convertir el modelo Sequelize a un objeto plano
      const userPlain = user.get({ plain: true });
      
      req.user = {
        id: userPlain.id,
        rol_id: userPlain.rol_id,
        refresh_token: userPlain.refresh_token,
        debe_cambiar_contrasena: Boolean(userPlain.debe_cambiar_contrasena),
        estudiante_id: decoded.estudiante_id || null // Añadir el ID del estudiante si existe
      };
      
      next();
    } catch (dbError) {
      console.error('Error en la base de datos:', dbError);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};