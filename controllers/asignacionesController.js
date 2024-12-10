// controllers/asignacionesController.js
import Asignacion from '../models/Asignacion.js';
import Estudiante from '../models/Estudiante.js';
import Institucion from '../models/Institucion.js';
import Receptor from '../models/Receptor.js';
import Usuario from '../models/Usuario.js';
import { Op, Sequelize } from 'sequelize';
import sequelize from '../models/index.js';

// Obtener todas las asignaciones
export const obtenerAsignaciones = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 5, 
      search = '', 
      month, 
      year
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Obtener información del usuario desde el token
    const { rol_id, id: usuarioId, estudiante_id } = req.user;

    // Construir where clause base
    let whereClause = {};

    // Filtrar por mes y año si se proporcionan
    if (month && year) {
      whereClause = {
        [Op.or]: [
          {
            [Op.and]: [
              Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('fecha_inicio')), month),
              Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('fecha_inicio')), year)
            ]
          },
          {
            [Op.and]: [
              Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('fecha_fin')), month),
              Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('fecha_fin')), year)
            ]
          }
        ]
      };
    }

    // Si el rol es de estudiante (rol_id === 3), solo mostrar sus asignaciones
    if (rol_id === 3) {
      whereClause.estudiante_id = estudiante_id;
    }

    // Configurar las opciones de búsqueda
    const queryOptions = {
      where: whereClause,
      include: [
        { 
          model: Estudiante,
          attributes: ['id', 'nombres', 'apellidos', 'rut'],
          where: search ? {
            [Op.or]: [
              { nombres: { [Op.like]: `%${search}%` } },
              { apellidos: { [Op.like]: `%${search}%` } },
              { rut: { [Op.like]: `%${search}%` } }
            ]
          } : undefined
        },
        { 
          model: Institucion,
          attributes: ['id', 'nombre']
        },
        { 
          model: Receptor,
          attributes: ['id', 'nombre', 'cargo'],
        }
      ],
      offset: Number(offset),
      limit: Number(limit),
      order: [['fecha_inicio', 'ASC']]
    };

    const { count, rows } = await Asignacion.findAndCountAll(queryOptions);

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

export const obtenerInstitucionesConAsignaciones = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 6, // Número de instituciones por página
      search = '', 
      month, 
      year 
    } = req.query;

    const offset = (page - 1) * limit;

    // Configurar las opciones de búsqueda para instituciones
    const institutionQueryOptions = {
      where: search ? {
        nombre: { [Op.like]: `%${search}%` }
      } : undefined,
      limit: Number(limit),
      offset: Number(offset)
    };

    // Obtener instituciones paginadas
    const { count, rows: instituciones } = await Institucion.findAndCountAll(institutionQueryOptions);

    // Obtener asignaciones para las instituciones obtenidas
    const institucionesConAsignaciones = await Promise.all(instituciones.map(async (institucion) => {
      const asignaciones = await Asignacion.findAll({
        where: {
          institucion_id: institucion.id,
          ...(month && year ? {
            [Op.and]: [
              Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('fecha_inicio')), month),
              Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('fecha_inicio')), year)
            ]
          } : {})
        },
        include: [
          { model: Estudiante, attributes: ['id', 'nombres', 'apellidos', 'rut'] },
          { model: Receptor, attributes: ['id', 'nombre', 'cargo'] }
        ],
        order: [['fecha_inicio', 'ASC']]
      });
      return { ...institucion.toJSON(), asignaciones }; // Combina institución y sus asignaciones
    }));

    return res.json({
      total: count,
      instituciones: institucionesConAsignaciones,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page)
    });

  } catch (error) {
    console.error('Error al obtener instituciones con asignaciones:', error);
    return res.status(500).json({
      message: 'Error al obtener instituciones con asignaciones',
      error: error.message
    });
  }
};

// Crear una nueva asignación
export const crearAsignacion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { 
      estudiante_id, 
      institucion_id, 
      receptor_id, 
      fecha_inicio, 
      fecha_fin,
      es_asignacion_excepcional = false,
      justificacion_excepcional
    } = req.body;

    // Verificar si el estudiante y la institución existen
    const estudiante = await Estudiante.findByPk(estudiante_id);
    const institucion = await Institucion.findByPk(institucion_id);

    if (!estudiante || !institucion) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Estudiante o institución no encontrados' });
    }

    // Verificar asignaciones existentes para el receptor en el mismo periodo
    const asignacionesExistentes = await Asignacion.findAll({
      where: {
        institucion_id,
        receptor_id,
        [Op.and]: [
          { fecha_inicio: { [Op.lte]: fecha_fin } },
          { fecha_fin: { [Op.gte]: fecha_inicio } }
        ]
      }
    });

    // Si hay asignaciones existentes y NO es una asignación excepcional
    if (asignacionesExistentes.length > 0 && !es_asignacion_excepcional) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Ya hay asignaciones para este receptor en este periodo.',
        asignaciones: asignacionesExistentes.map(a => ({
          estudiante: a.estudiante_id,
          fecha_inicio: a.fecha_inicio,
          fecha_fin: a.fecha_fin
        }))
      });
    }

    // Si es una asignación excepcional, requiere justificación
    if (es_asignacion_excepcional && !justificacion_excepcional) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Se requiere una justificación para la asignación excepcional'
      });
    }

    // Crear nueva asignación
    const nuevaAsignacion = await Asignacion.create({
      estudiante_id,
      institucion_id,
      receptor_id,
      fecha_inicio,
      fecha_fin,
      es_asignacion_excepcional,
      justificacion_excepcional
    }, { transaction });

    // Notificar sobre asignación excepcional si aplica
    if (es_asignacion_excepcional) {
      await notificarAsignacionExcepcional(nuevaAsignacion, req.user);
    }

    await transaction.commit();

    res.status(201).json({
      mensaje: es_asignacion_excepcional 
        ? 'Asignación excepcional creada exitosamente' 
        : 'Asignación creada exitosamente',
      asignacion: nuevaAsignacion
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear asignación:', error);
    res.status(500).json({
      error: 'Error al crear asignación',
      detalles: error.message
    });
  }
};

// Función para notificar sobre asignación excepcional
async function notificarAsignacionExcepcional(asignacion) {
  try {
    console.log('Asignación recibida (JSON):', JSON.stringify(asignacion));
    console.log('Asignación recibida (Objeto):', asignacion);
    
    // Extraer el ID de manera segura
    const asignacionId = asignacion.id;
    
    if (!asignacionId) {
      console.error('No se pudo encontrar el ID de la asignación');
      return;
    }

    console.log('Asignación ID:', asignacionId);
    
    // Busca la asignación con todas las relaciones
    const asignacionCompleta = await Asignacion.findOne({
      where: { id: asignacionId },
      include: [
        { 
          model: Estudiante, 
          attributes: ['id', 'nombres', 'correo'] 
        },
        { 
          model: Institucion, 
          attributes: ['id', 'nombre'] 
        },
        {
          model: Receptor,
          attributes: ['id', 'nombre']
        }
      ]
    });

    // Verificaciones adicionales de depuración
    console.log('Resultado de findOne:', asignacionCompleta);
    console.log('Existe asignacionCompleta:', !!asignacionCompleta);
    
    if (!asignacionCompleta) {
      // Intentar encontrar la asignación sin incluir relaciones
      const asignacionBasica = await Asignacion.findByPk(asignacionId);
      console.log('Asignación básica encontrada:', asignacionBasica);
      
      // Verificar si existen los modelos relacionados
      const estudianteExiste = await Estudiante.findByPk(asignacion.estudiante_id);
      const institucionExiste = await Institucion.findByPk(asignacion.institucion_id);
      const receptorExiste = await Receptor.findByPk(asignacion.receptor_id);

      console.log('Estudiante existe:', !!estudianteExiste);
      console.log('Institución existe:', !!institucionExiste);
      console.log('Receptor existe:', !!receptorExiste);

      console.error('No se encontró la asignación');
      return;
    }

    // Aquí podrías hacer algo con asignacionCompleta si lo necesitas
    console.log('Detalles de la asignación:', {
      estudiante: asignacionCompleta.estudiante?.nombres,
      institucion: asignacionCompleta.institucion?.nombre,
      receptor: asignacionCompleta.receptor?.nombre
    });

  } catch (error) {
    console.error('Error completo:', error);
    // Imprimir detalles específicos del error
    console.error('Nombre del error:', error.name);
    console.error('Mensaje del error:', error.message);
    console.error('Pila de error:', error.stack);
  }
}

// Función de utilidad para formatear fechas
function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

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