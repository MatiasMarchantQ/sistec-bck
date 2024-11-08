// src/controllers/authController.js
import { Op } from 'sequelize';
import Usuario from '../models/Usuario.js';
import Estudiante from '../models/Estudiante.js';
import Rol from '../models/Rol.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { Sequelize } from 'sequelize';
import { ROLES } from '../constants/roles.js'; // Importar los roles

// Crear una instancia de Sequelize
const sequelize = new Sequelize(db.database, db.user, db.password, {
  host: db.host,
  dialect: 'mysql'
});

export const obtenerUsuarios = async (req, res) => {
 try {
    const usuarios = await Usuario.findAll({
      include: [{
        model: Rol,
        attributes: ['nombre']
      }]
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, {
      include: [{
        model: Rol,
        attributes: ['nombre']
      }]
    });
    
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombres, apellidos, rut, correo, contrasena, rol_id } = req.body;

    if (!nombres || !apellidos || !rut || !correo || !contrasena) {
      return res.status(400).json({ 
        error: 'Todos los campos son obligatorios' 
      });
    }

    const existeCorreo = await Usuario.findOne({ where: { correo } });
    if (existeCorreo) {
      return res.status(400).json({ 
        error: 'El correo ya está registrado' 
      });
    }

    const existeRut = await Usuario.findOne({ where: { rut } });
    if (existeRut) {
      return res.status(400).json({ 
        error: 'El RUT ya está registrado' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(contrasena, salt);

    const usuario = await Usuario.create({
      nombres,
      apellidos,
      rut,
      correo,
      contrasena: contrasenaHash,
      rol_id,
      debe_cambiar_contrasena: true,
      estado: true
    });

    const usuarioSinContrasena = {
      ...usuario.toJSON(),
      contrasena: undefined
    };

    res.status(201).json(usuarioSinContrasena);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ 
      error: 'Error al crear el usuario',
      detalle: error.message 
    });
  }
};
export const login = async (req, res) => {
  try {
    const { rut, contrasena, rememberMe } = req.body;
    
    // Búsqueda para Usuario
    let user = await Usuario.findOne({ 
      where: sequelize.where(
        sequelize.col('rut'),
        { [Op.regexp]: `^${rut}-[0-9kK]$` }
      ),
      include: [{
        model: Rol,
        attributes: ['id', 'nombre']
      }]
    });

    if (!user) {
      // Búsqueda para Estudiante
      user = await Estudiante.findOne({
        where: sequelize.where(
          sequelize.fn('SUBSTRING_INDEX', sequelize.col('rut'), '-', 1),
          rut
        ),
        include: [{
          model: Rol,
          attributes: ['id', 'nombre']
        }]
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(contrasena, user.contrasena);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isEstudiante = user instanceof Estudiante;
    const { accessToken, refreshToken } = generateTokens(user, rememberMe, isEstudiante ? user.id : null);

    await user.update({ refresh_token: refreshToken });

    res.json({ 
      accessToken, 
      refreshToken,
      expiresIn: rememberMe ? '7d' : '1h',
      nombres: user.nombres,
      debe_cambiar_contrasena: Boolean(user.debe_cambiar_contrasena),
      usuario_id: isEstudiante ? null : user.id,
      estudiante_id: isEstudiante ? user.id : null,
      rol_id: user.Rol.id,
      rol_nombre: user.Rol.nombre
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

const generateTokens = (user, rememberMe = false, estudianteId = null) => {
  const accessToken = jwt.sign(
    { 
      id: user.id,
      rol_id: user.Rol.id,
      rol_nombre: user.Rol.nombre,
      estudiante_id: estudianteId,
      is_estudiante: estudianteId !== null
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: rememberMe ? '7d' : '1h' }
  );

  const refreshToken = jwt.sign(
    { 
      id: user.id,
      rol_id: user.Rol.id,
      is_estudiante: estudianteId !== null
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: rememberMe ? '60d' : '30d' }
  );

  return { accessToken, refreshToken };
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    let user = await Usuario.findOne({ where: { refresh_token: refreshToken } });
    
    if (!user) {
      user = await Estudiante.findOne({ where: { refresh_token: refreshToken } });
    }

    if (!user) {
      return res.status(403).json({ error: 'Refresh token inválido' });
    }
    
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Refresh token inválido' });
      }
      
      const isLongSession = decoded.exp - decoded.iat > 30 * 24 * 60 * 60;
      const isEstudiante = user instanceof Estudiante;
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, isLongSession, isEstudiante ? user.id : null);
  
      await user.update({ refresh_token: newRefreshToken });
  
      res.json({ 
        accessToken, 
        refreshToken: newRefreshToken,
        expiresIn: isLongSession ? '7d' : '1h'
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const logout = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }
  
    const { id, rol_id } = req.user;
  
    if (rol_id === ROLES.ESTUDIANTE) { // Asumiendo que 3 es el rol_id para estudiante
      const estudiante = await Estudiante.findByPk(id);
      if (!estudiante) {
        return res.status(404).json({
          error: 'Estudiante no encontrado'
        });
      }
  
      await Estudiante.update(
        { refresh_token: null },
        { where: { id } }
      );
    } else {
      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }
  
      await Usuario.update(
        { refresh_token: null },
        { where: { id } }
      );
    }
    
    res.clearCookie('refreshToken');
    
    return res.status(200).json({ 
      message: 'Logout exitoso' 
    });
  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(500).json({ 
      error: 'Error al cerrar sesión' 
    });
  }
};

export const cambiarContrasena = async (req, res) => {
  try {
    const { contrasenaActual, nuevaContrasena } = req.body;
    const userId = req.user.id;
    const userRolId = req.user.rol_id;
    const debeCambiarContrasena = Boolean(req.user.debe_cambiar_contrasena);

    console.log('Debug info inicial:', {
      userId,
      userRolId,
      debeCambiarContrasena,
      contrasenaActual,
      nuevaContrasena
    });

    let usuario;
    if (userRolId === ROLES.ESTUDIANTE) {
      usuario = await Estudiante.findByPk(userId);
    } else {
      usuario = await Usuario.findByPk(userId);
    }

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Si no debe cambiar la contraseña, validamos la contraseña actual
    if (!debeCambiarContrasena) {
      const validPassword = await bcrypt.compare(contrasenaActual, usuario.contrasena);
      if (!validPassword) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }
    }

    // Generar nueva contraseña hasheada
    const salt = await bcrypt.genSalt(10);
    const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, salt);

    // Actualizar usando el modelo
    if (userRolId === ROLES.ESTUDIANTE) {
      await usuario.update({
        contrasena: nuevaContrasenaHash,
        debe_cambiar_contrasena: false
      });
    } else {
      await usuario.update({
        contrasena: nuevaContrasenaHash,
        debe_cambiar_contrasena: false
      });
    }

    // Recargar el usuario para verificar los cambios
    await usuario.reload();

    console.log('Usuario actualizado:', {
      id: usuario.id,
      debe_cambiar_contrasena: usuario.debe_cambiar_contrasena
    });

    res.json({ 
      message: 'Contraseña actualizada exitosamente',
      debe_cambiar_contrasena: false
    });

  } catch (error) {
    console.error('Error detallado al cambiar la contraseña:', error);
    res.status(500).json({ 
      error: 'Error al cambiar la contraseña',
      details: error.message
    });
  }
};