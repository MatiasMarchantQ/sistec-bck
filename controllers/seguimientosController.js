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
            numeroLlamado: seguimiento.numero_llamado // Añadir número de llamado
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
      const datosFormateados = {
        paciente_id: req.body.pacienteId,
        ficha_id: req.body.fichaId,
        numero_llamado: req.body.numeroLlamado,
        fecha: req.body.fecha,
        riesgo_infeccion: req.body.riesgoInfeccion || {},
        riesgo_glicemia: req.body.riesgoGlicemia || {},
        riesgo_hipertension: req.body.riesgoHipertension || {},
        adherencia: req.body.adherencia || {},
        adherencia_tratamiento: req.body.adherenciaTratamiento || {},
        efectos_secundarios: req.body.efectosSecundarios || {},
        nutricion: req.body.nutricion || {},
        actividad_fisica: req.body.actividadFisica || {},
        eliminacion: req.body.eliminacion || {},
        sintomas_depresivos: req.body.sintomasDepresivos || '',
        autoeficacia: req.body.autoeficacia || {},
        otros_sintomas: req.body.otrosSintomas || ''
      };
  
      const nuevoSeguimiento = await SeguimientoAdulto.create(datosFormateados);
      res.status(201).json(nuevoSeguimiento);
    } catch (error) {
      console.error('Error al crear seguimiento de adulto:', error);
      res.status(500).json({ 
        error: 'Error al crear seguimiento de adulto',
        detalle: error.message 
      });
    }
  };
  
  export const obtenerSeguimientosAdulto = async (req, res) => {
    try {
      const { pacienteId } = req.params;
      const seguimientos = await SeguimientoAdulto.findAll({
        where: { paciente_id: pacienteId },
        order: [['fecha', 'DESC']]
      });
      res.status(200).json(seguimientos);
    } catch (error) {
      console.error('Error al obtener seguimientos de adulto:', error);
      res.status(500).json({ 
        error: 'Error al obtener seguimientos de adulto',
        detalle: error.message 
      });
    }
  };
  