import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const verifyToken = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.log('No se proporcionó token en el header');
        return res.status(401).json({ error: 'No token proporcionado' });
      }
  
      const token = authHeader.split(' ')[1];
      console.log('Token recibido:', token);

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        console.log('Token decodificado:', decoded);
      } catch (jwtError) {
        console.log('Error al verificar el token:', jwtError.message);
        return res.status(401).json({ error: 'Token inválido', details: jwtError.message });
      }
      
      // Verificar si el usuario existe y tiene un refresh token válido
      try {
        const [rows] = await db.query(
            'SELECT id, refresh_token FROM usuarios WHERE id = ?',
            [decoded.id]
        );
  
        if (rows.length === 0) {
          console.log('Usuario no encontrado o sin refresh token');
          return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const user = rows[0];
        console.log('Usuario autenticado:', user.id);
        req.user = user;
        next();
      } catch (dbError) {
        console.log('Error en la consulta a la base de datos:', dbError);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
    } catch (error) {
      console.log('Error general:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  };