// controllers/obtenerController.js
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import Receptor from '../models/Receptor.js';
import TipoInstitucion from '../models/TipoInstitucion.js';

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
  const { tipoId } = req.query; // Obtener el tipo de institución desde los parámetros de consulta
  try {
    const instituciones = await Institucion.findAll({
      where: { tipo_id: tipoId, estado: true }, // Filtrar por tipo y estado
      attributes: ['id', 'tipo']
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
      where: { institucion_id: institucionId },
      attributes: ['id', 'nombre', 'cargo']
    });
    res.json(receptores);
  } catch (error) {
    console.error('Error al obtener receptores:', error);
    res.status(500).json({ error: 'Error al obtener los receptores' });
  }
};