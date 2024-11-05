// controllers/institucionesController.js
import Institucion from '../models/Institucion.js';
import TipoInstitucion from '../models/TipoInstitucion.js';
import Receptor from '../models/Receptor.js';
import { Op } from 'sequelize';

export const obtenerInstituciones = async (req, res) => {
  const { page = 1, limit = 10, tipo, search, estado = 'activas' } = req.query;

  try {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (estado === 'activas') {
      whereClause.estado = true;
    } else if (estado === 'inactivas') {
      whereClause.estado = false;
    }

    if (tipo) {
      whereClause.tipo_id = tipo;
    }

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { receptora: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Institucion.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: TipoInstitucion,
            attributes: ['id', 'tipo']
          },
          {
            model: Receptor,
            as: 'receptores',  // Asegúrate de que este alias coincida
            attributes: ['id', 'nombre', 'cargo']
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [
          [{ model: TipoInstitucion }, 'tipo', 'ASC']
        ]
      });

    res.json({
      instituciones: rows,
      total: count
    });
  } catch (error) {
    console.error('Error al obtener instituciones:', error);
    res.status(500).json({ error: 'Error al obtener las instituciones' });
  }
};

export const crearInstitucion = async (req, res) => {
    try {
      const { nombre, tipo_id, receptores = [] } = req.body;
  
      const nuevaInstitucion = await Institucion.create({
        nombre,
        tipo_id,
        estado: true
      });
  
      if (receptores.length > 0) {
        const receptoresData = receptores.map(receptor => ({
          ...receptor,
          institucion_id: nuevaInstitucion.id
        }));
        await Receptor.bulkCreate(receptoresData);
      }
  
      // Obtener la institución con sus receptores
      const institucionConReceptores = await Institucion.findByPk(nuevaInstitucion.id, {
        include: [{
          model: Receptor,
          as: 'receptores',
          attributes: ['id', 'nombre', 'cargo']
        }]
      });
  
      res.status(201).json(institucionConReceptores);
    } catch (error) {
      console.error('Error al crear institución:', error);
      res.status(500).json({ error: 'Error al crear la institución' });
    }
  };

export const actualizarInstitucion = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo_id, receptora, estado } = req.body;

    const institucion = await Institucion.findByPk(id);
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    await institucion.update({
      nombre,
      tipo_id,
      receptora,
      estado: estado !== undefined ? estado : institucion.estado
    });

    res.json(institucion);
  } catch (error) {
    console.error('Error al actualizar institución:', error);
    res.status(500).json({ error: 'Error al actualizar la institución' });
  }
};

// Agregar nuevas funciones para receptores
export const agregarReceptor = async (req, res) => {
    try {
      const { institucion_id } = req.params;
      const { nombre, cargo } = req.body;
  
      const institucion = await Institucion.findByPk(institucion_id);
      if (!institucion) {
        return res.status(404).json({ error: 'Institución no encontrada' });
      }
  
      const nuevoReceptor = await Receptor.create({
        institucion_id,
        nombre,
        cargo
      });
  
      res.status(201).json(nuevoReceptor);
    } catch (error) {
      console.error('Error al agregar receptor:', error);
      res.status(500).json({ error: 'Error al agregar el receptor' });
    }
  };
  
  export const actualizarReceptor = async (req, res) => {
    try {
      const { receptor_id } = req.params;
      const { nombre, cargo } = req.body;
  
      const receptor = await Receptor.findByPk(receptor_id);
      if (!receptor) {
        return res.status(404).json({ error: 'Receptor no encontrado' });
      }
  
      await receptor.update({
        nombre,
        cargo
      });
  
      res.json(receptor);
    } catch (error) {
      console.error('Error al actualizar receptor:', error);
      res.status(500).json({ error: 'Error al actualizar el receptor' });
    }
  };
  
  export const eliminarReceptor = async (req, res) => {
    try {
      const { receptor_id } = req.params;
  
      const receptor = await Receptor.findByPk(receptor_id);
      if (!receptor) {
        return res.status(404).json({ error: 'Receptor no encontrado' });
      }
  
      await receptor.destroy();
      res.json({ mensaje: 'Receptor eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar receptor:', error);
      res.status(500).json({ error: 'Error al eliminar el receptor' });
    }
  };
  
  // Modificar el export default para incluir las nuevas funciones
  export default {
    obtenerInstituciones,
    crearInstitucion,
    actualizarInstitucion,
    agregarReceptor,
    actualizarReceptor,
    eliminarReceptor
  };