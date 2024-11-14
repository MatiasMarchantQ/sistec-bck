import SeguimientoInfantil from '../models/SeguimientoInfantil.js';
import SeguimientoAdulto from '../models/SeguimientoAdulto.js';
import PacienteInfantil from '../models/PacienteInfantil.js';
import PacienteAdulto from '../models/PacienteAdulto.js';
import { Op } from 'sequelize';


// Crear nuevo seguimiento
export const crearSeguimientoInfantil = async (req, res) => {
    try {
      const {
        pacienteId,
        fecha,
        grupoEdad,
        areaDPM,
      } = req.body;
  
      // Validar que el paciente infantil exista
      const pacienteExistente = await PacienteInfantil.findByPk(pacienteId);
  
      if (!pacienteExistente) {
        return res.status(400).json({ error: 'Paciente infantil no encontrado' });
      }
  
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
        area_socioemocional: areaDPM.socioemocional ? 1 : 0
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
                    attributes: ['nombres', 'apellidos', 'fecha_nacimiento']
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
                ['numero_llamado', 'ASC']  // Luego por número de llamado
            ],
            include: [
                {
                    model: PacienteInfantil,
                    as: 'paciente_infantil',
                    attributes: ['nombres', 'apellidos']
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
            numeroLlamado: seguimiento.numero_llamado
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
      comentarios
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
      comentarios: comentarios || ''
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
      const { id } = req.params; // ID del seguimiento
      const { pacienteId } = req.params; // Obtener el pacienteId de los parámetros de la URL

      // Buscar el seguimiento por ID y pacienteId
      const seguimiento = await SeguimientoAdulto.findOne({
          where: {
              id: parseInt(id, 10), // Asegúrate de que sea un número
              paciente_id: parseInt(pacienteId, 10) // Asegúrate de que sea un número
          },
          include: [
            {
              model: PacienteAdulto,
              as: 'paciente_adulto',
              attributes: ['rut', 'nombres', 'apellidos', 'edad', 'fecha_nacimiento', 'telefono_principal','telefono_secundario']
            },
            {
              model: Diagnostico,
              as: 'diagnostico', // Asegúrate de que el alias coincida con tu definición de modelo
              attributes: ['id', 'nombre'], // Ajusta los atributos según necesites
              required: false
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