// controllers/estudianteController.js
import Estudiante from '../models/Estudiante.js';
import Rol from '../models/Rol.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

export const cargarEstudiantes = async (req, res) => {
    try {
        const estudiantes = req.body;

        if (!Array.isArray(estudiantes)) {
            return res.status(400).json({ 
                error: 'Se esperaba un array de estudiantes' 
            });
        }

        // 1. Primero verificamos duplicados en el array entrante
        const rutsEntrantes = estudiantes.map(e => e.rut);
        const duplicadosInternos = rutsEntrantes.filter((rut, index) => 
            rutsEntrantes.indexOf(rut) !== index
        );

        if (duplicadosInternos.length > 0) {
            return res.status(400).json({
                error: 'Existen RUTs duplicados en el archivo',
                errores: duplicadosInternos.map(rut => ({
                    rut,
                    error: 'RUT duplicado en el archivo de entrada'
                })),
                fallidos: estudiantes.length,
                exitosos: 0
            });
        }

        // 2. Verificamos RUTs existentes en la base de datos
        const rutsExistentes = await Estudiante.findAll({
            where: {
                rut: {
                    [Op.in]: rutsEntrantes
                }
            },
            attributes: ['rut']
        });

        if (rutsExistentes.length > 0) {
            return res.status(400).json({
                error: 'Existen RUTs que ya están registrados',
                errores: rutsExistentes.map(e => ({
                    rut: e.rut,
                    error: 'RUT ya existe en la base de datos'
                })),
                fallidos: estudiantes.length,
                exitosos: 0
            });
        }

        // 3. Si llegamos aquí, podemos proceder con la inserción
        const ultimoEstudiante = await Estudiante.findOne({
            order: [['id', 'DESC']]
        });
        
        let siguienteId = ultimoEstudiante ? ultimoEstudiante.id + 1 : 1;
        const resultados = [];

        // 4. Creamos todos los estudiantes
        for (const estudiante of estudiantes) {
            const hashedPassword = await bcrypt.hash(estudiante.contrasena, 10);
            
            await Estudiante.create({
                id: siguienteId,
                nombres: estudiante.nombres,
                apellidos: estudiante.apellidos,
                rut: estudiante.rut,
                correo: estudiante.correo,
                contrasena: hashedPassword,
                debe_cambiar_contrasena: true,
                estado: true,
                contador_registros: 1,
                anos_cursados: estudiante.anos_cursados,
                semestre: estudiante.semestre,
                rol_id: 3
            });

            resultados.push({
                rut: estudiante.rut,
                mensaje: 'Estudiante creado exitosamente'
            });

            siguienteId++;
        }

        res.status(200).json({
            mensaje: 'Proceso de carga masiva completado exitosamente',
            resultados,
            errores: [],
            total_procesados: estudiantes.length,
            exitosos: resultados.length,
            fallidos: 0
        });

    } catch (error) {
        console.error('Error en carga masiva:', error);
        res.status(500).json({
            error: 'Error al procesar la carga masiva de estudiantes',
            detalles: error.message,
            fallidos: estudiantes?.length || 0,
            exitosos: 0
        });
    }
};

// controllers/estudianteController.js

export const obtenerEstudiantes = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', ano = '', semestre = '' } = req.query;
      const offset = (page - 1) * limit;
  
      let whereClause = {
        // estado: true
      };
  
      if (search) {
        whereClause = {
          ...whereClause,
          [Op.or]: [
            { nombres: { [Op.like]: `%${search}%` } },
            { apellidos: { [Op.like]: `%${search}%` } },
            { rut: { [Op.like]: `%${search}%` } }
          ]
        };
      }
  
      if (ano) {
        whereClause.anos_cursados = ano;
      }
  
      if (semestre) {
        whereClause.semestre = semestre;
      }
  
      const { count, rows } = await Estudiante.findAndCountAll({
        where: whereClause,
        include: [{
          model: Rol,
          attributes: ['nombre']
        }],
        offset: Number(offset),
        limit: Number(limit),
        order: [['id', 'ASC']]
      });
  
      return res.json({
        total: count,
        estudiantes: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: Number(page)
      });
  
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
      return res.status(500).json({ 
        message: 'Error al obtener estudiantes', 
        error: error.message 
      });
    }
  };

export const crearEstudiante = async (req, res) => {
  try {
    const { nombres, apellidos, rut, correo, contrasena, anos_cursados, semestre } = req.body;

    // Verificar si el RUT ya existe
    const estudianteExistente = await Estudiante.findOne({ where: { rut } });
    if (estudianteExistente) {
      return res.status(400).json({ error: 'El RUT ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const nuevoEstudiante = await Estudiante.create({
      nombres,
      apellidos,
      rut,
      correo,
      contrasena: hashedPassword,
      debe_cambiar_contrasena: true,
      estado: true,
      contador_registros: 1,
      anos_cursados,
      semestre,
      rol_id: 3 // Asumiendo que 3 es el ID para el rol de estudiante
    });

    res.status(201).json({
      mensaje: 'Estudiante creado exitosamente',
      estudiante: {
        id: nuevoEstudiante.id,
        nombres: nuevoEstudiante.nombres,
        apellidos: nuevoEstudiante.apellidos,
        rut: nuevoEstudiante.rut,
        correo: nuevoEstudiante.correo,
        anos_cursados: nuevoEstudiante.anos_cursados,
        semestre: nuevoEstudiante.semestre
      }
    });

  } catch (error) {
    console.error('Error al crear estudiante:', error);
    res.status(500).json({
      error: 'Error al crear estudiante',
      detalles: error.message
    });
  }
};

export const actualizarEstudiante = async (req, res) => {
    try {
      const { id } = req.params;
      const { nombres, apellidos, correo, anos_cursados, semestre, estado } = req.body;
  
      const estudiante = await Estudiante.findByPk(id);
      if (!estudiante) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }
  
      // Crear un objeto con los campos a actualizar
      const camposActualizar = {};
      
      // Solo incluir los campos que vienen en el body
      if (nombres !== undefined) camposActualizar.nombres = nombres;
      if (apellidos !== undefined) camposActualizar.apellidos = apellidos;
      if (correo !== undefined) camposActualizar.correo = correo;
      if (anos_cursados !== undefined) camposActualizar.anos_cursados = anos_cursados;
      if (semestre !== undefined) camposActualizar.semestre = semestre;
      if (estado !== undefined) camposActualizar.estado = estado;
  
      await estudiante.update(camposActualizar);
  
      res.status(200).json({
        mensaje: 'Estudiante actualizado exitosamente',
        estudiante: {
          id: estudiante.id,
          nombres: estudiante.nombres,
          apellidos: estudiante.apellidos,
          rut: estudiante.rut,
          correo: estudiante.correo,
          anos_cursados: estudiante.anos_cursados,
          semestre: estudiante.semestre,
          estado: estudiante.estado
        }
      });
  
    } catch (error) {
      console.error('Error al actualizar estudiante:', error);
      res.status(500).json({
        error: 'Error al actualizar estudiante',
        detalles: error.message
      });
    }
  };

export const eliminarEstudiante = async (req, res) => {
  try {
    const { id } = req.params;

    const estudiante = await Estudiante.findByPk(id);
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // En lugar de eliminar, cambiamos el estado a false
    await estudiante.update({ estado: false });

    res.status(200).json({
      mensaje: 'Estudiante eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    res.status(500).json({
      error: 'Error al eliminar estudiante',
      detalles: error.message
    });
  }
};