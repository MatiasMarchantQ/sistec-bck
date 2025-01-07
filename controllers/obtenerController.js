// controllers/obtenerController.js
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import Receptor from '../models/Receptor.js';
import TipoInstitucion from '../models/TipoInstitucion.js';
import Institucion from '../models/Institucion.js';
import NivelEscolaridad from '../models/NivelEscolaridad.js';
import CicloVitalFamiliar from '../models/CicloVitalFamiliar.js';
import TipoFamilia from '../models/TipoFamilia.js';
import FactorRiesgoNino from '../models/FactorRiesgoNino.js';
import FactorRiesgoFamiliar from '../models/FactorRiesgoFamiliar.js';
import Diagnostico from '../models/Diagnostico.js';

// Obtener todos los roles
export const obtenerRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      attributes: ['id', 'nombre']
    });
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ error: 'Error al obtener los roles' });
  }
};

// Obtener todos los tipos de instituciones
export const obtenerTiposInstituciones = async (req, res) => {
  try {
    const tiposInstituciones = await TipoInstitucion.findAll({
      attributes: ['id', 'tipo'],
      order: [['id', 'ASC']] // Esto ordenará los resultados por ID de forma ascendente
    });
    res.json(tiposInstituciones);
  } catch (error) {
    console.error('Error al obtener tipos de instituciones:', error);
    res.status(500).json({ error: 'Error al obtener los tipos de instituciones' });
  }
};

// Obtener instituciones filtradas por tipo
export const obtenerInstitucionesPorTipo = async (req, res) => {
  const { tipoId } = req.query;
  try {
    const instituciones = await Institucion.findAll({
      where: { 
        tipo_id: tipoId, 
        estado: true 
      },
      attributes: ['id', 'nombre'] // Cambiado 'tipo' por 'nombre' si ese es el campo correcto
    });
    res.json(instituciones);
  } catch (error) {
    console.error('Error al obtener instituciones:', error);
    res.status(500).json({ error: 'Error al obtener las instituciones' });
  }
};

// Obtener receptores por institución
export const obtenerReceptoresPorInstitucion = async (req, res) => {
  const { institucionId } = req.query; // Obtener el ID de la institución desde los parámetros de consulta
  try {
    const receptores = await Receptor.findAll({
      where: { 
        institucion_id: institucionId,
        estado: true // Filtrar solo los receptores activos
      },
      attributes: ['id', 'nombre', 'cargo', 'estado'] // Incluir el estado en los atributos
    });
    res.json(receptores);
  } catch (error) {
    console.error('Error al obtener receptores:', error);
    res.status(500).json({ error: 'Error al obtener los receptores' });
  }
};

export const obtenerNivelesEscolaridad = async (req, res) => {
  try {
    const nivelesEscolaridad = await NivelEscolaridad.findAll({
      attributes: ['id', 'nivel'],
      order: [['id', 'ASC']] // Esto ordenará los resultados por ID de forma ascendente
    });
    res.json(nivelesEscolaridad);
  } catch (error) {
    console.error('Error al obtener niveles de escolaridad:', error);
    res.status(500).json({ error: 'Error al obtener los niveles de escolaridad' });
  }
};

export const obtenerCiclosVitalesFamiliares = async (req, res) => {
  try {
    const ciclosVitales = await CicloVitalFamiliar.findAll({
      attributes: ['id', 'ciclo'],
      order: [['id', 'ASC']]
    });
    res.json(ciclosVitales);
  } catch (error) {
    console.error('Error al obtener ciclos vitales familiares:', error);
    res.status(500).json({ error: 'Error al obtener los ciclos vitales familiares' });
  }
};

// Nueva función para obtener tipos de familia
export const obtenerTiposFamilia = async (req, res) => {
  try {
    const tiposFamilia = await TipoFamilia.findAll({
      attributes: ['id', 'nombre'],  // Cambia 'tipo' por 'nombre' si ese es el nombre correcto de la columna
      order: [['id', 'ASC']]
    });
    res.json(tiposFamilia);
  } catch (error) {
    console.error('Error al obtener tipos de familia:', error);
    res.status(500).json({ error: 'Error al obtener los tipos de familia' });
  }
};

// Obtener factores de riesgo del niño
export const obtenerFactoresRiesgoNino = async (req, res) => {
  try {
    const factores = await FactorRiesgoNino.findAll({
      attributes: ['id', 'nombre', 'descripcion'],
      order: [['id', 'ASC']]
    });
    res.json(factores);
  } catch (error) {
    console.error('Error al obtener factores de riesgo del niño:', error);
    res.status(500).json({ error: 'Error al obtener los factores de riesgo del niño' });
  }
};

// Obtener factores de riesgo familiar
export const obtenerFactoresRiesgoFamiliar = async (req, res) => {
  try {
    const factores = await FactorRiesgoFamiliar.findAll({
      attributes: ['id', 'nombre', 'descripcion'],
      order: [['id', 'ASC']]
    });
    res.json(factores);
  } catch (error) {
    console.error('Error al obtener factores de riesgo familiar:', error);
    res.status(500).json({ error: 'Error al obtener los factores de riesgo familiar' });
  }
};

export const obtenerDiagnosticos = async (req, res) => {
  try {
      const diagnosticos = await Diagnostico.findAll({
          attributes: ['id', 'nombre'],
          order: [['id', 'ASC']] // Ordenar por ID de forma ascendente
      });
      res.json(diagnosticos);
  } catch (error) {
      console.error('Error al obtener diagnósticos:', error);
      res.status(500).json({ error: 'Error al obtener los diagnósticos' });
  }
};