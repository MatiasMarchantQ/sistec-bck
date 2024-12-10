// controllers/personalController.js
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import bcrypt from 'bcrypt';
import { enviarCredencialesUsuario } from '../services/emailService.js';
import { Op } from 'sequelize';

const generarContrasenaTemporalSegura = () => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  const longitudContrasena = 12;
  let contrasena = '';
  
  for (let i = 0; i < longitudContrasena; i++) {
    const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
    contrasena += caracteres[indiceAleatorio];
  }
  
  return contrasena;
};

export const enviarCredencialIndividual = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si la contraseña actual es un texto plano (no hasheada)
    let contrasenatemporal;
    
    // Función para verificar si una cadena está hasheada (ejemplo básico)
    const esContrasenaHasheada = (contrasena) => {
      // Criterios para identificar una contraseña hasheada
      return (
        contrasena && 
        (contrasena.startsWith('$2b$') || // Bcrypt
         contrasena.startsWith('$2a$') || // Bcrypt
         contrasena.length > 60) // Longitud típica de hash
    )};

    // Si la contraseña actual no está hasheada, usarla
    if (usuario.contrasena && 
        typeof usuario.contrasena === 'string' && 
        !esContrasenaHasheada(usuario.contrasena)) {
      contrasenatemporal = usuario.contrasena;
    } else {
      // Si la contraseña está hasheada o no es válida, generar una nueva
      contrasenatemporal = generarContrasenaTemporalSegura();
    }

    // Actualizar la contraseña en la base de datos
    await usuario.update({
      contrasena: contrasenatemporal,
      debe_cambiar_contrasena: true
    });

    // Enviar credenciales con la contraseña
    await enviarCredencialesUsuario(usuario, contrasenatemporal);

    res.status(200).json({
      mensaje: 'Credenciales enviadas exitosamente',
      correo: usuario.correo,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      debe_cambiar_contrasena: true
    });
  } catch (error) {
    console.error('Error al enviar credenciales:', error);
    res.status(500).json({
      error: 'Error al enviar credenciales',
      detalles: error.message
    });
  }
};

export const cambiarContrasenaUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaContrasena } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar contraseña sin hashear
    await usuario.update({
      contrasena: nuevaContrasena,
      debe_cambiar_contrasena: false
    });

    // // Enviar correo de notificación con la nueva contraseña
    // await enviarCredencialesUsuario(usuario, nuevaContrasena);

    res.status(200).json({ mensaje: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error al cambiar contraseña',
      detalles: error.message
    });
  }
};

export const obtenerPersonal = async (req, res) => {
  const { page = 1, limit = 10, tipo, search, estado = 'activos' } = req.query;

  try {
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Filtrar por estado
    if (estado === 'activos') {
      whereClause.estado = true;
    } else if (estado === 'inactivos') {
      whereClause.estado = false;
    }
    // Si estado es 'todos', no añadimos filtro de estado

    if (tipo) {
      whereClause.rol_id = tipo;
    }

    if (search) {
      whereClause[Op.or] = [
        { nombres: { [Op.like]: `%${search}%` } },
        { apellidos: { [Op.like]: `%${search}%` } },
        { correo: { [Op.like]: `%${search}%` } },
        { rut: { [Op.like]: `%${search}%` } }
      ];
    }

    const personal = await Usuario.findAndCountAll({
      where: whereClause,
      include: [{
        model: Rol,
        attributes: ['nombre']
      }],
      attributes: { 
        exclude: ['contrasena', 'refresh_token'] 
      },
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      usuarios: personal.rows,
      total: personal.count
    });
  } catch (error) {
    console.error('Error al obtener personal:', error);
    res.status(500).json({ error: 'Error al obtener el personal' });
  }
};

// Crear nuevo personal
// Crear nuevo personal
export const crearPersonal = async (req, res) => {
  try {
    const {
      rut,
      nombres,
      apellidos,
      correo,
      rol_id,
      contrasena
    } = req.body;

    // Verificar que el rol a asignar sea 1 o 2
    if (![1, 2].includes(parseInt(rol_id))) {
      return res.status(400).json({ error: 'Rol no válido' });
    }

    // Verificar si el RUT ya existe
    const rutExistente = await Usuario.findOne({ where: { rut } });
    if (rutExistente) {
      return res.status(400).json({ error: 'El RUT ya está registrado' });
    }

    // Verificar si el correo ya existe
    const correoExistente = await Usuario.findOne({ where: { correo } });
    if (correoExistente) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // NO hashear la contraseña, guardarla como texto
    const nuevoUsuario = await Usuario.create({
      rut,
      nombres,
      apellidos,
      correo,
      rol_id,
      contrasena: contrasena, // Guardar la contraseña como texto
      debe_cambiar_contrasena: true,
      estado: true
    });

    // Excluir datos sensibles en la respuesta
    const { contrasena: _, refresh_token: __, ...usuarioData } = nuevoUsuario.toJSON();

    res.status(201).json(usuarioData);
  } catch (error) {
    console.error('Error al crear personal:', error);
    res.status(500).json({ error: 'Error al crear el personal' });
  }
};

// Actualizar personal
export const actualizarPersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el usuario a modificar tenga rol 1 o 2
    if (![1, 2, 3].includes(usuario.rol_id)) {
      return res.status(403).json({ error: 'No puedes modificar este usuario' });
    }

    const {
      nombres,
      apellidos,
      correo,
      rol_id,
      contrasena,
      estado // Añadimos el estado a los datos que pueden ser actualizados
    } = req.body;

    // Verificar si el nuevo correo ya existe (si se está cambiando)
    if (correo && correo !== usuario.correo) {
      const correoExistente = await Usuario.findOne({ where: { correo } });
      if (correoExistente) {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }
    }

    let datosActualizacion = {
      nombres,
      apellidos,
      correo,
      rol_id,
      estado: estado !== undefined ? estado : usuario.estado // Actualizamos el estado si se proporciona
    };

    if (contrasena) {
      datosActualizacion.contrasena = await bcrypt.hash(contrasena, 10);
      datosActualizacion.debe_cambiar_contrasena = true;
    }

    await usuario.update(datosActualizacion);

    // Obtener usuario actualizado sin datos sensibles
    const usuarioActualizado = await Usuario.findByPk(id, {
      include: [{
        model: Rol,
        attributes: ['nombre']
      }],
      attributes: { exclude: ['contrasena', 'refresh_token'] }
    });

    res.json(usuarioActualizado);
  } catch (error) {
    console.error('Error al actualizar personal:', error);
    res.status(500).json({ error: 'Error al actualizar el personal' });
  }
};

// Eliminar personal (físicamente)
export const eliminarPersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    
    // Verificar si el usuario existe
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el usuario a eliminar tenga rol 1 o 2
    if (![1, 2].includes(usuario.rol_id)) {
      return res.status(403).json({ error: 'No puedes eliminar este usuario' });
    }

    // Eliminar el usuario de la base de datos
    await usuario.destroy();
    
    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar personal:', error);
    res.status(500).json({ error: 'Error al eliminar el personal' });
  }
};

// Obtener un personal específico
export const obtenerPersonalPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findOne({
      where: {
        id,
        rol_id: [1, 2],
        estado: true
      },
      include: [{
        model: Rol,
        attributes: ['nombre']
      }],
      attributes: { 
        exclude: ['contrasena', 'refresh_token'] 
      }
    });

    if (!usuario ) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener el personal:', error);
    res.status(500).json({ error: 'Error al obtener el personal' });
  }
};