// controllers/asignacionesController.js
import Asignacion from '../models/Asignacion.js';
import Estudiante from '../models/Estudiante.js';
import TipoInstitucion from '../models/TipoInstitucion.js';
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
      limit = 10, 
      search = '', 
      year,
      estado = 'todos',
      tieneJustificacion = false
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Construir filtros base para estudiantes
    const estudianteWhereClause = {};

    // Filtros de búsqueda para estudiantes
    if (search) {
      estudianteWhereClause[Op.or] = [
        { nombres: { [Op.like]: `%${search}%` } },
        { apellidos: { [Op.like]: `%${search}%` } },
        { rut: { [Op.like]: `%${search}%` } }
      ];
    }

    if (estado !== 'todos') {
      estudianteWhereClause.estado = estado === 'activos' ? true : false;
    }

    // Filtro por año cursado
    if (year) {
      estudianteWhereClause.anos_cursados = {
        [Op.like]: `%${year}%`
      };
    }

    // Obtener asignaciones con justificación
    const asignacionesConJustificacion = await Asignacion.findAll({
      where: {
        justificacion_excepcional: {
          [Op.not]: null
        }
      },
      attributes: ['estudiante_id']
    });

    // Filtro de justificación
    if (tieneJustificacion === 'true' || tieneJustificacion === true) {
      estudianteWhereClause.id = {
        [Op.in]: asignacionesConJustificacion.map(a => a.estudiante_id)
      };
    }

    // Obtener estudiantes base
    const { count: totalEstudiantes, rows: estudiantesBase } = await Estudiante.findAndCountAll({
      where: estudianteWhereClause,
      attributes: ['id', 'nombres', 'apellidos', 'correo', 'rut', 'estado', 'anos_cursados'],
      offset: Number(offset),
      limit: Number(limit),
      order: [
        [
          Sequelize.literal(`(
            SELECT COUNT(*) 
            FROM asignaciones 
            WHERE asignaciones.estudiante_id = Estudiante.id
          )`), 
          'DESC'
        ],
        ['id', 'ASC']
      ]
    });

    // Construir filtros de asignaciones
    const asignacionWhereClause = {
      estudiante_id: {
        [Op.in]: estudiantesBase.map(est => est.id)
      }
    };

    // Filtros de asignaciones
    if (year) {
      asignacionWhereClause[Op.or] = [
        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('fecha_inicio')), year),
        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('fecha_fin')), year)
      ];
    }

    // Filtro de justificación para asignaciones
    if (tieneJustificacion === 'true' || tieneJustificacion === true) {
      asignacionWhereClause.justificacion_excepcional = {
        [Op.not]: null
      };
    }

    // Obtener asignaciones para los estudiantes
    const asignaciones = await Asignacion.findAll({
      where: asignacionWhereClause,
      include: [
        { 
          model: Institucion,
          attributes: ['id', 'nombre']
        },
        { 
          model: Receptor,
          attributes: ['id', 'nombre', 'cargo']
        }
      ],
      order: [['fecha_inicio', 'DESC']]
    });

    // Combinar estudiantes con sus asignaciones
    const estudiantesConAsignaciones = estudiantesBase.map(estudiante => {
      const asignacionesDelEstudiante = asignaciones
        .filter(asig => asig.estudiante_id === estudiante.id)
        .map(asig => ({
          id: asig.id,
          institucion: asig.Institucion,
          receptor: asig.Receptor,
          fecha_inicio: asig.fecha_inicio,
          fecha_fin: asig.fecha_fin,
          justificacion_excepcional: asig.justificacion_excepcional
        }));

      return {
        ...estudiante.toJSON(),
        asignaciones: asignacionesDelEstudiante
      };
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(totalEstudiantes / limit);

    return res.json({
      total: totalEstudiantes,
      estudiantes: estudiantesConAsignaciones,
      totalPages: totalPages,
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

export const obtenerAsignacionesAgenda = async (req, res) => {
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
          attributes: ['id', 'nombre', 'tipo_id'],
          include: [
            {
              model: TipoInstitucion,
              as: 'tipoInstitucion',
              attributes: ['id', 'tipo']
            }
          ]
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

    if (!estudiante.estado) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'No se pueden crear asignaciones para estudiantes inactivos',
        message: 'El estudiante debe estar activo para recibir una asignación'
      });
    }

    // Validaciones adicionales de fechas
    if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'La fecha de inicio debe ser anterior a la fecha de fin' 
      });
    }

    // Verificar asignaciones existentes para el MISMO ESTUDIANTE
    const asignacionesExistentesEstudiante = await Asignacion.findAll({
      where: {
        estudiante_id,
        [Op.or]: [
          // Nueva asignación completamente dentro de una existente
          {
            fecha_inicio: { [Op.lte]: fecha_inicio },
            fecha_fin: { [Op.gte]: fecha_fin }
          },
          // Nueva asignación que comienza dentro de un periodo existente
          {
            fecha_inicio: { [Op.lte]: fecha_inicio },
            fecha_fin: { [Op.gte]: fecha_inicio }
          },
          // Nueva asignación que termina dentro de un periodo existente
          {
            fecha_inicio: { [Op.lte]: fecha_fin },
            fecha_fin: { [Op.gte]: fecha_fin }
          },
          // Nueva asignación que contiene completamente un periodo existente
          {
            fecha_inicio: { [Op.gte]: fecha_inicio },
            fecha_fin: { [Op.lte]: fecha_fin }
          }
        ]
      },
      include: [
        { 
          model: Institucion, 
          attributes: ['id', 'nombre'] 
        }
      ]
    });

    // Si el estudiante ya tiene asignaciones en periodos superpuestos
    if (asignacionesExistentesEstudiante.length > 0 && !es_asignacion_excepcional) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'El estudiante ya tiene una asignación que se superpone con el periodo indicado.',
        asignaciones: asignacionesExistentesEstudiante.map(a => ({
          institucion: {
            id: a.Institucion.id,
            nombre: a.Institucion.nombre
          },
          fecha_inicio: a.fecha_inicio,
          fecha_fin: a.fecha_fin
        }))
      });
    }

    // Verificar asignaciones existentes para el receptor en el mismo periodo
    const asignacionesExistentesReceptor = await Asignacion.findAll({
      where: {
        institucion_id,
        receptor_id,
        [Op.or]: [
          // Nueva asignación completamente dentro de una existente
          {
            fecha_inicio: { [Op.lte]: fecha_inicio },
            fecha_fin: { [Op.gte]: fecha_fin }
          },
          // Nueva asignación que comienza dentro de un periodo existente
          {
            fecha_inicio: { [Op.lte]: fecha_inicio },
            fecha_fin: { [Op.gte]: fecha_inicio }
          },
          // Nueva asignación que termina dentro de un periodo existente
          {
            fecha_inicio: { [Op.lte]: fecha_fin },
            fecha_fin: { [Op.gte]: fecha_fin }
          },
          // Nueva asignación que contiene completamente un periodo existente
          {
            fecha_inicio: { [Op.gte]: fecha_inicio },
            fecha_fin: { [Op.lte]: fecha_fin }
          }
        ]
      }
    });

    // Si hay asignaciones existentes para el receptor y NO es una asignación excepcional
    if (asignacionesExistentesReceptor.length > 0 && !es_asignacion_excepcional) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Ya hay asignaciones para este receptor en el periodo indicado.',
        asignaciones: asignacionesExistentesReceptor.map(a => ({
          estudiante: a.estudiante_id,
          fecha_inicio: a.fecha_inicio,
          fecha_fin: a.fecha_fin
        })),
        permitirExcepcional: true
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
      await notificarAsignacionExcepcional(nuevaAsignacion);
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
    // Extraer el ID de manera segura
    const asignacionId = asignacion.id;
    
    if (!asignacionId) {
      console.error('No se pudo encontrar el ID de la asignación');
      return;
    }

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

    if (!asignacionCompleta) {
      // Intentar encontrar la asignación sin incluir relaciones
      const asignacionBasica = await Asignacion.findByPk(asignacionId);
      
      // Verificar si existen los modelos relacionados
      const estudianteExiste = await Estudiante.findByPk(asignacion.estudiante_id);
      const institucionExiste = await Institucion.findByPk(asignacion.institucion_id);
      const receptorExiste = await Receptor.findByPk(asignacion.receptor_id);
      console.error('No se encontró la asignación');
      return;
    }

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
    const { 
      institucion_id, 
      receptor_id,
      fecha_inicio, 
      fecha_fin, 
      estado,
      es_asignacion_excepcional,
      justificacion_excepcional 
    } = req.body;

    const asignacion = await Asignacion.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    const camposActualizar = {};
    
    // Campos base
    if (institucion_id !== undefined) camposActualizar.institucion_id = institucion_id;
    if (receptor_id !== undefined) camposActualizar.receptor_id = receptor_id;
    if (fecha_inicio !== undefined) camposActualizar.fecha_inicio = fecha_inicio;
    if (fecha_fin !== undefined) camposActualizar.fecha_fin = fecha_fin;
    if (estado !== undefined) camposActualizar.estado = estado;

    // Manejar asignación excepcional y justificación
    if (es_asignacion_excepcional !== undefined) {
      camposActualizar.es_asignacion_excepcional = es_asignacion_excepcional;
      
      // Si es una asignación excepcional, incluir justificación
      if (es_asignacion_excepcional) {
        camposActualizar.justificacion_excepcional = justificacion_excepcional || null;
      } else {
        // Si no es una asignación excepcional, limpiar justificación
        camposActualizar.justificacion_excepcional = null;
      }
    }
    // Realizar la actualización
    const asignacionActualizada = await asignacion.update(camposActualizar);

    // Cargar la asignación actualizada con sus relaciones
    const asignacionCompleta = await Asignacion.findByPk(id, {
      include: [
        { model: Institucion, attributes: ['id', 'nombre'] },
        { model: Receptor, attributes: ['id', 'nombre', 'cargo'] },
        { model: Estudiante, attributes: ['id', 'nombres', 'apellidos'] }
      ]
    });

    res.status(200).json({
      mensaje: 'Asignación actualizada exitosamente',
      asignacion: asignacionCompleta
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