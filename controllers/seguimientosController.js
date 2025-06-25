import SeguimientoInfantil from '../models/SeguimientoInfantil.js';
import SeguimientoAdulto from '../models/SeguimientoAdulto.js';
import PacienteInfantil from '../models/PacienteInfantil.js';
import PacienteAdulto from '../models/PacienteAdulto.js';
import Usuario from '../models/Usuario.js';
import Estudiante from '../models/Estudiante.js';
import Diagnostico from '../models/Diagnostico.js';
import FichaClinicaAdulto from '../models/FichaClinicaAdulto.js';
import { Op } from 'sequelize';


// Crear nuevo seguimiento
export const crearSeguimientoInfantil = async (req, res) => {
  try {
    const {
      pacienteId,
      fecha,
      grupoEdad,
      areaDPM,
      usuario_id,
      estudiante_id
    } = req.body;

    // Validar que el paciente infantil exista
    const pacienteExistente = await PacienteInfantil.findByPk(pacienteId);

    if (!pacienteExistente) {
      return res.status(400).json({ error: 'Paciente infantil no encontrado' });
    }

    // Buscar el último seguimiento para este paciente
    const ultimoSeguimiento = await SeguimientoInfantil.findOne({
      where: { paciente_id: pacienteId },
      order: [['numero_llamado', 'DESC']]
    });

    // Generar número de llamado
    const numero_llamado = ultimoSeguimiento 
      ? ultimoSeguimiento.numero_llamado + 1 
      : 1;

    const nuevoSeguimiento = await SeguimientoInfantil.create({
      paciente_id: pacienteId,
      tipo_paciente: 'infantil',
      fecha,
      grupo_edad: grupoEdad,
      // Convertir booleanos a enteros (0 o 1)
      area_motor_grueso: areaDPM.motorGrueso ? 1 : 0,
      area_motor_fino: areaDPM.motorFino ? 1 : 0,
      area_comunicacion: areaDPM.comunicacion ? 1 : 0,
      area_cognoscitivo: areaDPM.cognoscitivo ? 1 : 0,
      area_socioemocional: areaDPM.socioemocional ? 1 : 0,
      usuario_id: usuario_id,
      estudiante_id: estudiante_id || null,
      numero_llamado: numero_llamado
    });

    res.status(201).json(nuevoSeguimiento);
  } catch (error) {
    console.error('Error al crear seguimiento infantil:', error);
    res.status(500).json({ 
      error: 'Error al crear el seguimiento infantil',
      detalle: error.message,
      stack: error.stack
    });
  }
};

  export const obtenerSeguimientoInfantilPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const seguimiento = await SeguimientoInfantil.findByPk(id, {
            include: [
                {
                    model: PacienteInfantil,
                    as: 'paciente_infantil',
                    attributes: ['nombres', 'apellidos', 'rut', 'fecha_nacimiento','edad','telefono_principal','telefono_secundario']
                }
            ]
        });

        if (!seguimiento) {
            return res.status(404).json({ 
                error: 'Seguimiento infantil no encontrado' 
            });
        }

        // Formatear seguimiento
        const seguimientoFormateado = {
            ...seguimiento.toJSON(),
            areaDPM: {
                motorGrueso: seguimiento.area_motor_grueso === 1,
                motorFino: seguimiento.area_motor_fino === 1,
                comunicacion: seguimiento.area_comunicacion === 1,
                cognoscitivo: seguimiento.area_cognoscitivo === 1,
                socioemocional: seguimiento.area_socioemocional === 1
            },
            numeroLlamado: seguimiento.numero_llamado // Añadir número de llamado
        };

        res.status(200).json(seguimientoFormateado);
    } catch (error) {
        console.error('Error al obtener seguimiento infantil:', error);
        res.status(500).json({ 
            error: 'Error al obtener el seguimiento infantil',
            detalle: error.message,
            stack: error.stack
        });
    }
};

export const obtenerSeguimientosInfantiles = async (req, res) => {
    try {
        const { pacienteId } = req.params;

        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Validar que el paciente infantil exista
        const pacienteExistente = await PacienteInfantil.findByPk(pacienteId);

        if (!pacienteExistente) {
            return res.status(404).json({ error: 'Paciente infantil no encontrado' });
        }

        // Buscar seguimientos del paciente con paginación
        const { count, rows: seguimientos } = await SeguimientoInfantil.findAndCountAll({
            where: { paciente_id: pacienteId },
            limit,
            offset,
            order: [
                ['grupo_edad', 'ASC'],  // Primero por grupo de edad
                ['numero_llamado', 'DESC']  // Luego por número de llamado
            ],
            include: [
                {
                    model: PacienteInfantil,
                    as: 'paciente_infantil',
                    attributes: ['nombres', 'apellidos', 'rut', 'fecha_nacimiento','edad','telefono_principal','telefono_secundario']
                },
                {
                  model: Usuario,
                  as: 'SeguimientoUsuario',
                  attributes: ['nombres', 'apellidos', 'rut', 'correo']
              },
              {
                  model: Estudiante,
                  as: 'SeguimientoEstudiante',
                  attributes: ['nombres', 'apellidos', 'rut', 'correo']
              }
            ]
        });

        // Formatear seguimientos
        const seguimientosFormateados = seguimientos.map(seguimiento => ({
            ...seguimiento.toJSON(),
            areaDPM: {
                motorGrueso: seguimiento.area_motor_grueso === 1,
                motorFino: seguimiento.area_motor_fino === 1,
                comunicacion: seguimiento.area_comunicacion === 1,
                cognoscitivo: seguimiento.area_cognoscitivo === 1,
                socioemocional: seguimiento.area_socioemocional === 1
            },
            recomendaciones: {
                areaMotora: seguimiento.recomendacion_motora,
                areaLenguaje: seguimiento.recomendacion_lenguaje,
                areaSocioemocional: seguimiento.recomendacion_socioemocional,
                areaCognitiva: seguimiento.recomendacion_cognitiva
            },
            numeroLlamado: seguimiento.numero_llamado,
            usuario: seguimiento.SeguimientoUsuario,
            estudiante: seguimiento.SeguimientoEstudiante
        }));

        res.status(200).json({
            total: count,
            page,
            limit,
            seguimientos: seguimientosFormateados
        });
    } catch (error) {
        console.error('Error al obtener seguimientos infantiles:', error);
        res.status(500).json({ 
            error: 'Error al obtener los seguimientos infantiles',
            detalle: error.message,
            stack: error.stack
        });
    }
};

export const crearSeguimientoAdulto = async (req, res) => {
  try {
    const { 
      pacienteId, 
      esLlamadoFinal,
      fecha,
      riesgoInfeccion,
      riesgoGlicemia,
      riesgoHipertension,
      adherencia,
      adherenciaTratamiento,
      efectosSecundarios,
      nutricion,
      actividadFisica,
      eliminacion,
      sintomasDepresivos,
      autoeficacia,
      otrosSintomas,
      manejoSintomas,
      comentario_primer_llamado,
      comentario_segundo_llamado,
      comentario_tercer_llamado,
      estudiante_id,
      usuario_id
    } = req.body;

    // Buscar el último seguimiento del paciente para determinar el siguiente número de llamado
    const ultimoSeguimiento = await SeguimientoAdulto.findOne({
      where: { paciente_id: pacienteId },
      order: [['numero_llamado', 'DESC']] // Ordenar por numero_llamado de forma descendente
    });

    // Calcular el siguiente numeroLlamado
    const numeroLlamado = ultimoSeguimiento ? ultimoSeguimiento.numero_llamado + 1 : 1; // Incrementar el número de llamado

    // Preparar datos formateados
    const datosFormateados = {
      paciente_id: pacienteId,
      numero_llamado: numeroLlamado,
      es_llamado_final: esLlamadoFinal || false,
      fecha: fecha || new Date().toISOString(),
      riesgo_infeccion: riesgoInfeccion || {},
      riesgo_glicemia: riesgoGlicemia || {},
      riesgo_hipertension: riesgoHipertension || {},
      adherencia: adherencia || {},
      adherencia_tratamiento: adherenciaTratamiento || {},
      efectos_secundarios: efectosSecundarios || {},
      nutricion: nutricion || {},
      actividad_fisica: actividadFisica || {},
      eliminacion: eliminacion || {},
      sintomas_depresivos: sintomasDepresivos || '',
      autoeficacia: autoeficacia || {},
      otros_sintomas: otrosSintomas || '',
      manejo_sintomas: manejoSintomas || '',
      comentario_primer_llamado: comentario_primer_llamado || '',
      comentario_segundo_llamado: comentario_segundo_llamado || '',
      comentario_tercer_llamado: comentario_tercer_llamado || '',
      estudiante_id: estudiante_id || null,
      usuario_id: usuario_id || null
    };

    // Crear nuevo seguimiento
    const nuevoSeguimiento = await SeguimientoAdulto.create(datosFormateados);

    res.status(201).json(nuevoSeguimiento);
  } catch (error) {
    console.error('Error al procesar seguimiento de adulto:', error);
    
    // Manejo de errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Error de validación',
        detalles: error.errors.map(e => e.message)
      });
    }

    // Manejo de errores de unicidad
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Conflicto de datos',
        detalles: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({ 
      error: 'Error al procesar seguimiento de adulto',
      detalle: error.message 
    });
  }
};

// Controlador para obtener seguimientos
export const obtenerSeguimientosAdulto = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    
    // Validar que se proporcione pacienteId
    if (!pacienteId) {
      return res.status(400).json({ 
        error: 'ID de paciente es requerido' 
      });
    }

    const seguimientos = await SeguimientoAdulto.findAll({
      where: { paciente_id: pacienteId },
      order: [['numero_llamado', 'DESC']],
      attributes: { 
        exclude: ['createdAt', 'updatedAt']
      },
      include: [
        {
          model: PacienteAdulto,
          as: 'paciente_adulto',
          attributes: ['rut', 'nombres', 'apellidos', 'edad', 'fecha_nacimiento', 'telefono_principal','telefono_secundario']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombres', 'apellidos', 'rut', 'correo']
        },
        {
          model: Estudiante,
          as: 'estudiante',
          attributes: ['id', 'nombres', 'apellidos','rut','correo']
        }
      ]
    });

    // Manejar caso de no encontrar seguimientos
    if (seguimientos.length === 0) {
      return res.status(404).json({ 
        mensaje: 'No se encontraron seguimientos para este paciente' 
      });
    }

    res.status(200).json(seguimientos);
  } catch (error) {
    console.error('Error al obtener seguimientos de adulto:', error);
    res.status(500).json({ 
      error: 'Error al obtener seguimientos de adulto',
      detalle: error.message 
    });
  }
};

// En tu archivo de controladores (seguimientosController.js)
export const obtenerSeguimientoAdultoPorId = async (req, res) => {
  try {
      const { id, pacienteId } = req.params;

      const seguimiento = await SeguimientoAdulto.findOne({
          where: {
              id: parseInt(id, 10),
              paciente_id: parseInt(pacienteId, 10)
          },
          include: [
              {
                  model: PacienteAdulto,
                  as: 'paciente_adulto',
                  attributes: ['rut', 'nombres', 'apellidos', 'edad', 'fecha_nacimiento', 'telefono_principal', 'telefono_secundario']
              },
              {
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombres', 'apellidos', 'rut', 'correo']
              },
              {
                model: Estudiante,
                as: 'estudiante',
                attributes: ['id', 'nombres', 'apellidos','rut','correo']
              }
          ]
      });

      if (!seguimiento) {
          return res.status(404).json({ 
              mensaje: `No se encontraron seguimientos para el paciente con ID ${pacienteId} y seguimiento ID ${id}` 
          });
      }

      res.status(200).json(seguimiento);
  } catch (error) {
      console.error('Error al obtener seguimiento de adulto:', error);
      res.status(500).json({ 
          error: 'Error al obtener el seguimiento de adulto',
          detalle: error.message,
          stack: error.stack
      });
  }
};
export const actualizarSeguimientoAdulto = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      pacienteId, 
      fichaId, 
      comentario_primer_llamado,
      comentario_segundo_llamado,
      comentario_tercer_llamado,
      ...datosActualizacion 
    } = req.body;

    const seguimientoExistente = await SeguimientoAdulto.findByPk(id);

    if (!seguimientoExistente) {
      return res.status(404).json({ message: 'Seguimiento no encontrado' });
    }

    // Función de serialización segura y mejorada
    const serializar = (datos) => {
      if (datos === null || datos === undefined) {
        return '{}';
      }
    
      try {
        // Si ya es un string, devolverlo directamente
        if (typeof datos === 'string') {
          return datos;
        }

        // Si es un objeto, convertirlo a string
        const jsonString = JSON.stringify(datos, (key, value) => {
          if (value === undefined) return null;
          return value;
        });
    
        return jsonString.replace(/\\/g, '');
      } catch (error) {
        console.error('Error en serialización:', error);
        return '{}';
      }
    };

    // Inicializar datosParaActualizar después de la verificación de seguimiento existente
    const datosParaActualizar = {};

    // Mapeo de nombres de campos
    const mapeoNombres = {
      riesgoInfeccion: 'riesgo_infeccion',
      riesgoGlicemia: 'riesgo_glicemia',
      riesgoHipertension: 'riesgo_hipertension',
      adherencia: 'adherencia',
      adherenciaTratamiento: 'adherencia_tratamiento',
      efectosSecundarios: 'efectos_secundarios',
      nutricion: 'nutricion',
      actividadFisica: 'actividad_fisica',
      eliminacion: 'eliminacion',
      sintomasDepresivos: 'sintomas_depresivos',
      autoeficacia: 'autoeficacia'
    };

    // Iterar sobre los campos serializables
    Object.keys(mapeoNombres).forEach(campoCliente => {
      const campoDB = mapeoNombres[campoCliente];
      
      if (datosActualizacion[campoCliente] !== undefined) {
        datosParaActualizar[campoDB] = serializar(datosActualizacion[campoCliente]);
      }
    });

    // Manejo especial para comentarios
    if (datosActualizacion.comentarios !== undefined) {
      // Si es un objeto, convertirlo a string JSON
      if (typeof datosActualizacion.comentarios === 'object') {
        datosParaActualizar.comentarios = JSON.stringify(datosActualizacion.comentarios);
      } else {
        // Si ya es un string, usarlo directamente
        datosParaActualizar.comentarios = datosActualizacion.comentarios;
      }
    }

    // Campos de texto plano
    const mapeoTexto = {
      otrosSintomas: 'otros_sintomas',
      manejoSintomas: 'manejo_sintomas'
    };

    // Iterar sobre campos de texto
    Object.keys(mapeoTexto).forEach(campoCliente => {
      const campoDB = mapeoTexto[campoCliente];
      
      if (datosActualizacion[campoCliente] !== undefined) {
        datosParaActualizar[campoDB] = datosActualizacion[campoCliente];
      }
    });

    // Campos booleanos o especiales
    if (datosActualizacion.esLlamadoFinal !== undefined) {
      datosParaActualizar.es_llamado_final = datosActualizacion.esLlamadoFinal;
    }

    // Campos de fecha
    if (datosActualizacion.fecha) {
      datosParaActualizar.fecha = datosActualizacion.fecha;
    }

    // Añadir campos de comentarios específicos
    if (comentario_primer_llamado !== undefined) {
      datosParaActualizar.comentario_primer_llamado = comentario_primer_llamado;
    }
    
    if (comentario_segundo_llamado !== undefined) {
      datosParaActualizar.comentario_segundo_llamado = comentario_segundo_llamado;
    }
    
    if (comentario_tercer_llamado !== undefined) {
      datosParaActualizar.comentario_tercer_llamado = comentario_tercer_llamado;
    }

    // Verificar si hay datos para actualizar
    if (Object.keys(datosParaActualizar).length === 0) {
      return res.status(400).json({ 
        message: 'No se proporcionaron datos para actualizar' 
      });
    }

    // Actualizar el seguimiento
    await seguimientoExistente.update(datosParaActualizar);

    // Recuperar el seguimiento actualizado
    const seguimientoActualizado = await SeguimientoAdulto.findByPk(id);

    return res.status(200).json({
      message: 'Seguimiento actualizado correctamente', 
      data: seguimientoActualizado
    });

  } catch (error) {
    console.error('Error detallado al actualizar seguimiento:', error);
    return res.status(500).json({ 
      message: 'Error al actualizar el seguimiento',
      error: error.message,
      detalleError: error.stack
    });
  }
};

export const actualizarSeguimientoInfantil = async (req, res) => {
  try {
    const { id } = req.params; // ID del seguimiento a actualizar
    const { 
      pacienteId, 
      fecha,
      grupoEdad,
      areaDPM,
      usuario_id,
      estudiante_id
    } = req.body;

    // Buscar el seguimiento infantil existente
    const seguimientoExistente = await SeguimientoInfantil.findByPk(id);

    if (!seguimientoExistente) {
      return res.status(404).json({ message: 'Seguimiento infantil no encontrado' });
    }

    // Preparar los datos para actualizar
    const datosParaActualizar = {
      paciente_id: pacienteId,
      fecha: fecha || seguimientoExistente.fecha, // Mantener la fecha existente si no se proporciona una nueva
      grupo_edad: grupoEdad || seguimientoExistente.grupo_edad, // Mantener el grupo de edad existente si no se proporciona uno nuevo,
      area_motor_grueso: areaDPM.motorGrueso ? 1 : 0,
      area_motor_fino: areaDPM.motorFino ? 1 : 0,
      area_comunicacion: areaDPM.comunicacion ? 1 : 0,
      area_cognoscitivo: areaDPM.cognoscitivo ? 1 : 0,
      area_socioemocional: areaDPM.socioemocional ? 1 : 0,
      usuario_id: usuario_id || seguimientoExistente.usuario_id, // Mantener el usuario existente si no se proporciona uno nuevo
      estudiante_id: estudiante_id || seguimientoExistente.estudiante_id // Mantener el estudiante existente si no se proporciona uno nuevo
    };

    // Actualizar el seguimiento
    await seguimientoExistente.update(datosParaActualizar);

    // Recuperar el seguimiento actualizado
    const seguimientoActualizado = await SeguimientoInfantil.findByPk(id, {
      include: [
        {
          model: PacienteInfantil,
          as: 'paciente_infantil',
          attributes: ['nombres', 'apellidos', 'rut', 'fecha_nacimiento','edad','telefono_principal','telefono_secundario']
        }
      ]
    });

    return res.status(200).json({
      message: 'Seguimiento infantil actualizado correctamente', 
      data: seguimientoActualizado
    });

  } catch (error) {
    console.error('Error al actualizar seguimiento infantil:', error);
    return res.status(500).json({ 
      message: 'Error al actualizar el seguimiento infantil',
      error: error.message,
      detalleError: error.stack
    });
  }
};