import SeguimientoInfantil from '../models/SeguimientoInfantil.js';
import PacienteInfantil from '../models/PacienteInfantil.js';
import PacienteAdulto from '../models/PacienteAdulto.js';
import { Op } from 'sequelize';


// Crear nuevo seguimiento
export const crearSeguimientoInfantil = async (req, res) => {
    try {
      const {
        pacienteId,
        fecha,
        edadMeses,
        grupoEdad,
        areaDPM,
        recomendaciones
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
        edad_meses: edadMeses,
        grupo_edad: grupoEdad,
        area_motor_grueso: JSON.stringify(areaDPM.motorGrueso || []),
        area_motor_fino: JSON.stringify(areaDPM.motorFino || []),
        area_comunicacion: JSON.stringify(areaDPM.comunicacion || []),
        area_cognoscitivo: JSON.stringify(areaDPM.cognoscitivo || []),
        area_socioemocional: JSON.stringify(areaDPM.socioemocional || []),
        recomendacion_motora: recomendaciones.areaMotora,
        recomendacion_lenguaje: recomendaciones.areaLenguaje,
        recomendacion_socioemocional: recomendaciones.areaSocioemocional,
        recomendacion_cognitiva: recomendaciones.areaCognitiva
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

        // Buscar el seguimiento infantil por ID, incluyendo detalles del paciente
        const seguimiento = await SeguimientoInfantil.findByPk(id, {
            include: [
                {
                    model: PacienteInfantil,
                    as: 'paciente_infantil', // Asegúrate de que el alias coincida con tu definición de asociación
                    attributes: ['nombres', 'apellidos', 'fecha_nacimiento'] // Campos que quieres recuperar
                }
            ]
        });

        // Si no se encuentra el seguimiento
        if (!seguimiento) {
            return res.status(404).json({ 
                error: 'Seguimiento infantil no encontrado' 
            });
        }

        // Parsear campos JSON
        const seguimientoFormateado = {
            ...seguimiento.toJSON(),
            areaDPM: {
                motorGrueso: JSON.parse(seguimiento.area_motor_grueso || '[]'),
                motorFino: JSON.parse(seguimiento.area_motor_fino || '[]'),
                comunicacion: JSON.parse(seguimiento.area_comunicacion || '[]'),
                cognoscitivo: JSON.parse(seguimiento.area_cognoscitivo || '[]'),
                socioemocional: JSON.parse(seguimiento.area_socioemocional || '[]')
            },
            recomendaciones: {
                areaMotora: seguimiento.recomendacion_motora,
                areaLenguaje: seguimiento.recomendacion_lenguaje,
                areaSocioemocional: seguimiento.recomendacion_socioemocional,
                areaCognitiva: seguimiento.recomendacion_cognitiva
            }
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
            order: [['fecha', 'DESC']], // Ordenar por fecha de seguimiento
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
                motorGrueso: JSON.parse(seguimiento.area_motor_grueso || '[]'),
                motorFino: JSON.parse(seguimiento.area_motor_fino || '[]'),
                comunicacion: JSON.parse(seguimiento.area_comunicacion || '[]'),
                cognoscitivo: JSON.parse(seguimiento.area_cognoscitivo || '[]'),
                socioemocional: JSON.parse(seguimiento.area_socioemocional || '[]')
            },
            recomendaciones: {
                areaMotora: seguimiento.recomendacion_motora,
                areaLenguaje: seguimiento.recomendacion_lenguaje,
                areaSocioemocional: seguimiento.recomendacion_socioemocional,
                areaCognitiva: seguimiento.recomendacion_cognitiva
            }
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

//   export const crearSeguimientoAdulto = async (req, res) => {
//     try {
//       const {
//         pacienteId,
//         fecha,
//         // Otros campos específicos de adultos
//         evaluacionCognitiva,
//         evaluacionFuncional,
//         recomendaciones
//       } = req.body;
  
//       // Validar que el paciente adulto exista
//       const pacienteExistente = await PacienteAdulto.findByPk(pacienteId);
  
//       if (!pacienteExistente) {
//         return res.status(400).json({ error: 'Paciente adulto no encontrado' });
//       }
  
//       const nuevoSeguimiento = await SeguimientoAdulto.create({
//         paciente_id: pacienteId,
//         tipo_paciente: 'adulto',
//         fecha,
//         evaluacion_cognitiva: JSON.stringify(evaluacionCognitiva),
//         evaluacion_funcional: JSON.stringify(evaluacionFuncional),
//         recomendaciones: JSON.stringify(recomendaciones)
//         // Añade más campos según sea necesario
//       });
  
//       res.status(201).json(nuevoSeguimiento);
//     } catch (error) {
//       console.error('Error al crear seguimiento de adulto:', error);
//       res.status(500).json({ error: 'Error al crear el seguimiento de adulto' });
//     }
//   };
  
//   export const obtenerSeguimientosAdulto = async (req, res) => {
//     try {
//       const { pacienteId } = req.params;
  
//       const seguimientos = await SeguimientoAdulto.findAll({
//         where: { 
//           paciente_id: pacienteId,
//           tipo_paciente: 'adulto'
//         },
//         order: [['fecha', 'DESC']]
//       });
  
//       res.status(200).json(seguimientos);
//     } catch (error) {
//       console.error('Error al obtener seguimientos de adulto:', error);
//       res.status(500).json({ error: 'Error al obtener los seguimientos de adulto' });
//     }
//   };