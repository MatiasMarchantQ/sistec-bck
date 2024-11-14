// controllers/asignacionesController.js
import Asignacion from '../models/Asignacion.js';
import Estudiante from '../models/Estudiante.js';
import Institucion from '../models/Institucion.js';
import Receptor from '../models/Receptor.js';
import { Op } from 'sequelize';

// Obtener todas las asignaciones
export const obtenerAsignaciones = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    if (search) {
      whereClause = {
        [Op.or]: [
          { '$Estudiante.nombres$': { [Op.like]: `%${search}%` } },
          { '$Estudiante.apellidos$': { [Op.like]: `%${search}%` } },
          { '$Institucion.nombre$': { [Op.like]: `%${search}%` } },
        ]
      };
    }

    const { count, rows } = await Asignacion.findAndCountAll({
      where: whereClause,
      include: [
        { model: Estudiante, attributes: ['nombres', 'apellidos'] },
        { 
          model: Institucion, 
          attributes: ['nombre'],
          include: [{ model: Receptor, attributes: ['nombre'], as: 'receptores' }]
        },
        { model: Receptor, attributes: ['id', 'nombre', 'cargo'] }
      ],
      offset: Number(offset),
      limit: Number(limit),
      order: [['fecha_inicio', 'DESC']]
    });

    return res.json({
      total: count,
      asignaciones: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page)
    });

  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    return res.status(500).json({ 
      message: 'Error al obtener asignaciones', 
      error: error.message 
    });
  }
};

// Crear una nueva asignación
export const crearAsignacion = async (req, res) => {
  try {
    const { estudiante_id, institucion_id, receptor_id, fecha_inicio, fecha_fin } = req.body;

    console.log("Verificando asignaciones existentes para:", {
      institucion_id,
      receptor_id,
      fecha_inicio,
      fecha_fin
    });
    // Verificar si el estudiante y la institución existen
    const estudiante = await Estudiante.findByPk(estudiante_id);
    const institucion = await Institucion.findByPk(institucion_id);

    if (!estudiante || !institucion) {
      return res.status(400).json({ error: 'Estudiante o institución no encontrados' });
    }

    // Verificar si ya hay asignaciones para el mismo receptor en el mismo periodo
    const asignacionesExistentes = await Asignacion.findAll({
      where: {
        institucion_id,
        receptor_id,
        [Op.and]: [
          {
            // Nueva fecha de inicio debe ser menor o igual a la fecha de fin existente
            fecha_inicio: { [Op.lte]: fecha_fin },
          },
          {
            // Nueva fecha de fin debe ser mayor o igual a la fecha de inicio existente
            fecha_fin: { [Op.gte]: fecha_inicio }
          }
        ]
      }
    });

    // Si hay asignaciones existentes para el mismo receptor y periodo, retornar error
    if (asignacionesExistentes.length > 0) {
      return res.status(400).json({ error: 'Ya hay asignaciones para este receptor en este periodo.' });
    }

    console.log("Asignaciones existentes encontradas:", asignacionesExistentes);

    // Crear nueva asignación
    const nuevaAsignacion = await Asignacion.create({
      estudiante_id,
      institucion_id,
      receptor_id,
      fecha_inicio,
      fecha_fin
    });

    res.status(201).json({
      mensaje: 'Asignación creada exitosamente',
      asignacion: nuevaAsignacion
    });

  } catch (error) {
    console.error('Error al crear asignación:', error);
    res.status(500).json({
      error: 'Error al crear asignación',
      detalles: error.message
    });
  }
};

// Actualizar una asignación
export const actualizarAsignacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { institucion_id, fecha_inicio, fecha_fin, estado } = req.body;

    const asignacion = await Asignacion.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    const camposActualizar = {};
    if (institucion_id !== undefined) camposActualizar.institucion_id = institucion_id;
    if (fecha_inicio !== undefined) camposActualizar.fecha_inicio = fecha_inicio;
    if (fecha_fin !== undefined) camposActualizar.fecha_fin = fecha_fin;
    if (estado !== undefined) camposActualizar.estado = estado;

    await asignacion.update(camposActualizar);

    res.status(200).json({
      mensaje: 'Asignación actualizada exitosamente',
      asignacion: asignacion
    });

  } catch (error) {
    console.error('Error al actualizar asignación:', error);
    res.status(500).json({
      error: 'Error al actualizar asignación',
      detalles: error.message
    });
  }
};

// Eliminar una asignación
export const eliminarAsignacion = async (req, res) => {
  try {
    const { id } = req.params;

    // Busca la asignación por ID
    const asignacion = await Asignacion.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    // Eliminar físicamente la asignación
    await asignacion.destroy();

    res.status(200).json({
      mensaje: 'Asignación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar asignación:', error);
    res.status(500).json({
      error: 'Error al eliminar asignación',
      detalles: error.message
    });
  }
};

// Obtener asignaciones por estudiante
export const obtenerAsignacionesPorEstudiante = async (req, res) => {
  try {
    const { estudiante_id } = req.params;

    const asignaciones = await Asignacion.findAll({
      where: { estudiante_id, estado: true },
      include: [{ model: Institucion, attributes: ['nombre'] }],
      order: [['fecha_inicio', 'DESC']]
    });

    res.status(200).json(asignaciones);

  } catch (error) {
    console.error('Error al obtener asignaciones por estudiante:', error);
    res.status(500).json({
      error: 'Error al obtener asignaciones por estudiante',
      detalles: error.message
    });
  }
};

// Verificar disponibilidad de cupos
export const verificarDisponibilidadCupos = async (req, res) => {
  try {
    const { institucion_id, fecha_inicio, fecha_fin } = req.query;

    const institucion = await Institucion.findByPk(institucion_id);
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    const asignacionesActuales = await Asignacion.count({
      where: {
        institucion_id,
        fecha_inicio: { [Op.lte]: fecha_fin },
        fecha_fin: { [Op.gte]: fecha_inicio },
        estado: true
      }
    });

    const cuposDisponibles = institucion.cupos - asignacionesActuales;

    res.status(200).json({
      cuposDisponibles,
      cuposTotales: institucion.cupos,
      asignacionesActuales
    });

  } catch (error) {
    console.error('Error al verificar disponibilidad de cupos:', error);
    res.status(500).json({
      error: 'Error al verificar disponibilidad de cupos',
      detalles: error.message
    });
  }
};