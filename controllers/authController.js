// src/controllers/authController.js
import { Op } from 'sequelize';
import Usuario from '../models/Usuario.js';
import Estudiante from '../models/Estudiante.js';
import Rol from '../models/Rol.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { enviarCorreoRecuperacion } from '../services/emailService.js';
import { Sequelize } from 'sequelize';
import { ROLES } from '../constants/roles.js';

import dotenv from 'dotenv';
dotenv.config();


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

    // Validar que se proporcionen RUT y contraseña
    if (!rut || !contrasena) {
      return res.status(400).json({ 
        error: 'RUT y contraseña son obligatorios',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar solo en la tabla de Estudiantes
    const estudiante = await Estudiante.findOne({
      where: { rut: { [Op.regexp]: `^${rut}$` } },
      include: [{ model: Rol, attributes: ['id', 'nombre'] }]
    });

    // Verificar si el estudiante existe
    if (!estudiante) {
      return res.status(404).json({ 
        error: 'Estudiante no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar estado del estudiante
    if (!estudiante.estado) {
      return res.status(403).json({ 
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Validar contraseña
    let validPassword;
    if (estudiante.debe_cambiar_contrasena) {
      // La contraseña es temporal y se almacena como texto plano
      validPassword = estudiante.contrasena === contrasena;
    } else {
      // La contraseña está hasheada
      validPassword = await bcrypt.compare(contrasena, estudiante.contrasena);
    }

    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Contraseña incorrecta',
        code: 'INVALID_PASSWORD'
      });
    }

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(estudiante, rememberMe);

    // Actualizar el estudiante con el nuevo refresh token
    await estudiante.update({ 
      refresh_token: refreshToken
    });

    res.json({ 
      accessToken, 
      refreshToken,
      expiresIn: rememberMe ? '7d' : '1h',
      nombres: estudiante.nombres,
      debe_cambiar_contrasena: Boolean(estudiante.debe_cambiar_contrasena),
      estudiante_id: estudiante.id,
      rol_id: estudiante.Rol.id,
      rol_nombre: estudiante.Rol.nombre
    });
  } catch (error) {
    console.error('Error en login de estudiantes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// En tu controlador de autenticación

export const loginDirectores = async (req, res) => {
  try {
    const { rut, contrasena, rememberMe } = req.body;

    // Validar que se proporcionen RUT y contraseña
    if (!rut || !contrasena) {
      return res.status(400).json({ 
        error: 'RUT y contraseña son obligatorios',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar solo en la tabla de Usuarios
    const user = await Usuario.findOne({
      where: { rut: { [Op.regexp]: `^${rut}$` } },
      include: [{ model: Rol, attributes: ['id', 'nombre'] }]
    });

    // Verificar si el usuario existe
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar estado del usuario
    if (!user.estado) {
      return res.status(403).json({ 
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Función para verificar si una contraseña está hasheada
    const esContrasenaHasheada = (contrasena) => {
      return (
        contrasena && 
        (contrasena.startsWith('$2b$') || // Bcrypt
         contrasena.startsWith('$2a$') || // Bcrypt
         contrasena.length > 60) // Longitud típica de hash
    )};

    // Validar contraseña
    let validPassword;
    if (!esContrasenaHasheada(user.contrasena)) {
      // Si la contraseña no está hasheada, comparar directamente
      validPassword = user.contrasena === contrasena;
    } else {
      // Si la contraseña está hasheada, usar bcrypt
      validPassword = await bcrypt.compare(contrasena, user.contrasena);
    }

    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Contraseña incorrecta',
        code: 'INVALID_PASSWORD'
      });
    }

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(user, rememberMe);

    // Restablecer intentos fallidos
    await user.update({ 
      refresh_token: refreshToken,
      intentos_fallidos: 0,
      bloqueado_hasta: null
    });

    res.json({ 
      accessToken, 
      refreshToken,
      expiresIn: rememberMe ? '7d' : '1h',
      nombres: user.nombres,
      debe_cambiar_contrasena: Boolean(user.debe_cambiar_contrasena),
      usuario_id: user.id,
      rol_id: user.Rol.id,
      rol_nombre: user.Rol.nombre
    });
  } catch (error) {
    console.error('Error en login de directores:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const generateTokens = (user, rememberMe = false, estudianteId = null) => {
  const accessToken = jwt.sign(
    { 
      id: user.id,
      rol_id: user.Rol.id,
      rol_nombre: user.Rol.nombre,
      estudiante_id: user.Rol.id === 3 ? user.id : estudianteId,  // Cambio clave
      is_estudiante: user.Rol.id === 3 || estudianteId !== null
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: rememberMe ? '7d' : '1h' }
  );

  const refreshToken = jwt.sign(
    { 
      id: user.id,
      rol_id: user.Rol.id,
      estudiante_id: user.Rol.id === 3 ? user.id : estudianteId,  // Añadir esto
      is_estudiante: user.Rol.id === 3 || estudianteId !== null
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
  
    if (rol_id === ROLES.ESTUDIANTE) {
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
    const userId = req.user.id; // ID del usuario desde el token
    const userRolId = req.user.rol_id; // Rol del usuario
    const debeCambiarContrasena = Boolean(req.user.debe_cambiar_contrasena); // Estado de cambio de contraseña

    console.log('Rol del usuario:', userRolId);
    let usuario;

    // Validación de la nueva contraseña
    const regexContrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/; // Al menos una minúscula, una mayúscula, un número y longitud entre 8 y 20
    if (!regexContrasena.test(nuevaContrasena)) {
      return res.status(400).json({ error: 'La nueva contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y tener entre 8 y 20 caracteres.' });
    }

    // Si el rol es 3, buscamos en Estudiante
    if (userRolId === 3) {
      // Buscar en Estudiante usando el userId
      usuario = await Estudiante.findByPk(userId);
      
      // Verificar si el estudiante existe
      if (!usuario) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }

      // Validar la contraseña actual solo si no debe cambiarla
      if (!debeCambiarContrasena) {
        const validPassword = await bcrypt.compare(contrasenaActual, usuario.contrasena);
        if (!validPassword) {
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }
      }

      // Verificar que la nueva contraseña no sea igual a la actual
      const contrasenaActualHash = usuario.contrasena;
      if (await bcrypt.compare(nuevaContrasena, contrasenaActualHash)) {
        return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la contraseña actual.' });
      }

      // Generar nueva contraseña hasheada
      const salt = await bcrypt.genSalt(10);
      const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, salt);

      // Actualizar la contraseña y el estado de debe_cambiar_contrasena en Estudiante
      await Estudiante.update(
        { contrasena: nuevaContrasenaHash, debe_cambiar_contrasena: false },
        { where: { id: userId } }
      );

      return res.json({ 
        message: 'Contraseña del estudiante actualizada exitosamente',
        debe_cambiar_contrasena: false
      });

    } else {
      // Para otros roles, buscar en Usuario
      usuario = await Usuario.findByPk(userId);
      
      // Verificar si el usuario existe
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Validar la contraseña actual solo si no debe cambiarla
      if (!debeCambiarContrasena) {
        const validPassword = await bcrypt.compare(contrasenaActual, usuario.contrasena);
        if (!validPassword) {
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }
      }

      // Verificar que la nueva contraseña no sea igual a la actual
      const contrasenaActualHash = usuario.contrasena;
      if (await bcrypt.compare(nuevaContrasena, contrasenaActualHash)) {
        return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la contraseña actual.' });
      }

      // Generar nueva contraseña hasheada
      const salt = await bcrypt.genSalt(10);
      const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, salt);

      // Actualizar la contraseña y el estado de debe_cambiar_contrasena en Usuario
      await Usuario.update(
        { contrasena: nuevaContrasenaHash, debe_cambiar_contrasena: false },
        { where: { id: userId } }
      );

      return res.json({ 
        message: 'Contraseña del usuario actualizada exitosamente',
        debe_cambiar_contrasena: false
      });
    }

  } catch (error) {
    console.error('Error detallado al cambiar la contraseña:', error);
    res.status(500).json({ 
      error: 'Error al cambiar la contraseña',
      details: error.message
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user.id; // Suponiendo que el middleware de verificación establece req.user
    let usuario = await Usuario.findByPk(userId);
    
    if (!usuario) {
      usuario = await Estudiante.findByPk(userId);
    }

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener los datos del usuario' });
  }
};

//Gestion datos personales
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, correo, rut } = req.body;

    // Verificar si el usuario existe
    let usuario = await Usuario.findByPk(id);
    if (!usuario) {
      usuario = await Estudiante.findByPk(id);
    }

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Actualizar los datos
    const updatedData = {
      nombres,
      apellidos,
      correo,
      rut
    };

    // Validar si el rol es estudiante o usuario
    if (usuario.rol_id === ROLES.ESTUDIANTE) {
      await Estudiante.update(updatedData, { where: { id } });
    } else {
      await Usuario.update(updatedData, { where: { id } });
    }

    res.json({ mensaje: 'Datos actualizados correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar los datos' });
  }
};

export const actualizarEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, correo, rut } = req.body;

    // Verificar si el estudiante existe
    const estudiante = await Estudiante.findByPk(id);

    if (!estudiante) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado' });
    }

    // Validaciones
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rutRegex = /^\d{7,8}$/; // Solo números entre 7 y 8 dígitos

    if (!emailRegex.test(correo)) {
      return res.status(400).json({ mensaje: 'Correo electrónico inválido' });
    }

    if (!rutRegex.test(rut)) {
      return res.status(400).json({ mensaje: 'RUT inválido. Debe contener entre 7 y 8 números sin puntos ni guión' });
    }

    // Actualizar los datos
    await Estudiante.update(
      { 
        nombres, 
        apellidos, 
        correo, 
        rut 
      }, 
      { 
        where: { id } 
      }
    );

    // Obtener los datos actualizados
    const estudianteActualizado = await Estudiante.findByPk(id, {
      attributes: ['id', 'nombres', 'apellidos', 'correo', 'rut']
    });

    res.json({ 
      mensaje: 'Datos actualizados correctamente',
      estudiante: estudianteActualizado
    });

  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    res.status(500).json({ error: 'Error al actualizar los datos' });
  }
};

//Recuperacion contraseña
export const solicitarRecuperacionContrasena = async (req, res) => {
  try {
    if (!process.env.JWT_RESET_SECRET) {
      console.error('JWT_RESET_SECRET no está definido');
      return res.status(500).json({ 
        error: 'Error de configuración del servidor' 
      });
    }

    const { email } = req.body;

    let usuario = await Usuario.findOne({ where: { correo: email } }) ||
                  await Estudiante.findOne({ where: { correo: email } });

    if (!usuario) {
      return res.status(404).json({ 
        error: 'No se encontró un usuario con este correo electrónico' 
      });
    }

    const tiempoActual = new Date();
    const tiempoDesdeUltimaSolicitud = usuario.ultima_solicitud_recuperacion ? tiempoActual - usuario.ultima_solicitud_recuperacion : null;

    // Reiniciar el contador si ha pasado más de 15 minutos
    if (tiempoDesdeUltimaSolicitud >= 15 * 60 * 1000) {
      usuario.intentos_recuperacion = 0;
    }

    // Bloquear si se han excedido los intentos
    if (usuario.intentos_recuperacion >= 3) {
      if (!usuario.bloqueado_hasta || new Date() > usuario.bloqueado_hasta) {
        usuario.bloqueado_hasta = new Date(Date.now() + 30 * 60 * 1000); // Bloquear por 30 minutos
        await usuario.save();
        return res.status(429).json({ 
          error: 'Demasiados intentos de recuperación. Por favor, inténtelo más tarde.' 
        });
      } else {
        return res.status(429).json({
          error: `Bloqueado hasta ${usuario.bloqueado_hasta.toISOString()}`
        });
      }
    }

    // Generar token de recuperación con JWT
    const resetToken = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.correo 
      }, 
      process.env.JWT_RESET_SECRET, 
      { 
        expiresIn: '1h' 
      }
    );

    // Guardar token y fecha de expiración
    usuario.reset_password_token = resetToken;
    usuario.reset_password_expires = new Date(Date.now() + 3600000); // 1 hora
    usuario.ultima_solicitud_recuperacion = tiempoActual; // Actualizar la última solicitud
    usuario.intentos_recuperacion += 1; // Incrementar el contador
    await usuario.save();

    // Enviar correo de recuperación
    await enviarCorreoRecuperacion(usuario.correo, resetToken);

    res.status(200).json({ 
      message: 'Se ha enviado un correo para restablecer la contraseña' 
    });
  } catch (error) {
    console.error('Error en solicitud de recuperación:', error);
    res.status(500).json({ 
      error: 'Error al procesar la solicitud de recuperación',
      detalle: error.message
    });
  }
};

export const restablecerContrasena = async (req, res) => {
  try {
    const { token, nuevaContrasena } = req.body;

    // Validación de la nueva contraseña
    const regexContrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/; // Al menos una minúscula, una mayúscula, un número y longitud entre 8 y 20
    if (!regexContrasena.test(nuevaContrasena)) {
      return res.status(400).json({ error: 'La nueva contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y tener entre 8 y 20 caracteres.' });
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    } catch (error) {
      return res.status(400).json({ 
        error: 'Token inválido o expirado' 
      });
    }

    // Buscar usuario en ambos modelos
    let usuario = await Usuario.findOne({
      where: {
        id: decoded.id,
        reset_password_token: token,
        reset_password_expires: {
          [Op.gt]: new Date() // Mayor que la fecha actual
        }
      }
    });

    if (!usuario) {
      usuario = await Estudiante.findOne({
        where: {
          id: decoded.id,
          reset_password_token: token,
          reset_password_expires: {
            [Op.gt]: new Date() // Mayor que la fecha actual
          }
        }
      });
    }

    if (!usuario) {
      return res.status(400).json({ 
        error: 'Token inválido o expirado' 
      });
    }

    // Generar nueva contraseña hasheada
    const salt = await bcrypt.genSalt(10);
    const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, salt);

    // Actualizar contraseña y limpiar token
    usuario.contrasena = nuevaContrasenaHash;
    usuario.reset_password_token = null;
    usuario.reset_password_expires = null;
    usuario.debe_cambiar_contrasena = false;
    await usuario.save();

    res.status(200).json({ 
      message: 'Contraseña restablecida exitosamente' 
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ 
      error: 'Error al restablecer la contraseña' 
    });
  }
};