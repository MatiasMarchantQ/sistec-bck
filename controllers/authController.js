// src/controllers/authController.js
import { Op } from 'sequelize';
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { Sequelize } from 'sequelize';

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
    
    // Buscar el usuario por el RUT
    const user = await Usuario.findOne({ 
      where: sequelize.where(
        sequelize.col('rut'),
        { [Op.regexp]: `^${rut}-[0-9kK]$` }
      ),
      include: [{
        model: Rol,
        attributes: ['nombre']
      }]
    });

    if (!user) {
      console.log('Usuario no encontrado para el RUT:', rut);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(contrasena, user.contrasena);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Genera tokens basados en la opción rememberMe
    const { accessToken, refreshToken } = generateTokens(user, rememberMe);

    // Actualizar el refresh token en la base de datos
    await user.update({ refresh_token: refreshToken });

    // Enviamos los tokens y la información del usuario al cliente
    res.json({ 
      accessToken, 
      refreshToken,
      expiresIn: rememberMe ? '7d' : '1h',
      nombres: user.nombres,
      debe_cambiar_contrasena: user.debe_cambiar_contrasena
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Modificar generateTokens para incluir más información en el payload
const generateTokens = (user, rememberMe = false) => {
  const accessToken = jwt.sign(
    { 
      id: user.id,
      rol: user.Rol.nombre
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: rememberMe ? '7d' : '1h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: rememberMe ? '60d' : '30d' }
  );

  return { accessToken, refreshToken };
};

  export const refreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      const user = await Usuario.findOne({ 
        where: { refresh_token: refreshToken } 
      });
  
      if (!user) {
        return res.status(403).json({ error: 'Refresh token inválido' });
      }
  
      // Verificar el token
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: 'Refresh token inválido' });
        }
  
        // Generar nuevo access token
        // Nota: mantenemos la misma duración que se usó originalmente
        const isLongSession = decoded.exp - decoded.iat > 30 * 24 * 60 * 60; // > 30 días
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, isLongSession);
  
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
  
      const usuario = await Usuario.findByPk(req.user.id);
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }
  
      await Usuario.update(
        { refresh_token: null },
        { where: { id: req.user.id } }
      );
      
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
      console.log('Iniciando cambio de contraseña');
      const { contrasenaActual, nuevaContrasena } = req.body;
      console.log('Usuario ID:', req.user.id);
      const userId = req.user.id;
  
      // Obtener el usuario de la base de datos
      console.log('Buscando usuario en la base de datos');
      const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [userId]);
      console.log('Resultado de la búsqueda:', rows);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      const usuario = rows[0];
  
      // Verificar contraseña actual
      console.log('Verificando contraseña actual');
      const validPassword = await bcrypt.compare(contrasenaActual, usuario.contrasena);
      if (!validPassword) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }
  
      // Hash nueva contraseña
      console.log('Generando hash de nueva contraseña');
      const salt = await bcrypt.genSalt(10);
      const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, salt);
  
      // Actualizar contraseña en la base de datos
      console.log('Actualizando contraseña en la base de datos');
      await db.query(
        'UPDATE usuarios SET contrasena = ?, debe_cambiar_contrasena = false WHERE id = ?',
        [nuevaContrasenaHash, userId]
      );
  
      console.log('Contraseña actualizada exitosamente');
      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error detallado al cambiar la contraseña:', error);
      res.status(500).json({ 
        error: 'Error al cambiar la contraseña',
        details: error.message
      });
    }
};