// controllers/estudianteController.js
import Estudiante from '../models/Estudiante.js';
import Rol from '../models/Rol.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

export const cargarEstudiantes = async (req, res) => {
  try {
    const estudiantes = req.body;
    const resultados = [];
    const errores = [];
    let nuevosEstudiantes = 0;
    let estudiantesActualizados = 0;

    // Obtener el último ID de la tabla
    const ultimoEstudiante = await Estudiante.findOne({
      order: [['id', 'DESC']]
    });
    let ultimoId = ultimoEstudiante ? ultimoEstudiante.id : 0;

    for (const estudiante of estudiantes) {
      try {
        // Buscar el estudiante por RUT o correo
        let estudianteExistente = await Estudiante.findOne({
          where: {
            [Op.or]: [
              { rut: estudiante.rut },
              { correo: estudiante.correo }
            ]
          }
        });

        if (estudianteExistente) {
          // Lógica de actualización existente...
          const anosActuales = estudianteExistente.anos_cursados.split(',');
          const nuevoAno = estudiante.anos_cursados;

          if (!anosActuales.includes(nuevoAno)) {
            anosActuales.push(nuevoAno);
            await estudianteExistente.update({
              nombres: estudiante.nombres,
              apellidos: estudiante.apellidos,
              correo: estudiante.correo,
              anos_cursados: anosActuales.join(','),
              semestre: estudiante.semestre,
              contador_registros: estudianteExistente.contador_registros + 1
            });
            estudiantesActualizados++;
            resultados.push({
              rut: estudiante.rut,
              mensaje: `Estudiante actualizado con nuevo año: ${nuevoAno}`
            });
          } else {
            await estudianteExistente.update({
              nombres: estudiante.nombres,
              apellidos: estudiante.apellidos,
              correo: estudiante.correo,
              semestre: estudiante.semestre
            });
            resultados.push({
              rut: estudiante.rut,
              mensaje: `Estudiante existente actualizado, año ${nuevoAno} ya registrado`
            });
          }
        } else {
          // Incrementar el último ID para el nuevo estudiante
          ultimoId++;
          
          // Crear nuevo estudiante con ID específico
          await Estudiante.create({
            id: ultimoId, // Especificamos el ID
            nombres: estudiante.nombres,
            apellidos: estudiante.apellidos,
            rut: estudiante.rut,
            correo: estudiante.correo,
            contrasena: await bcrypt.hash(estudiante.contrasena, 10),
            debe_cambiar_contrasena: true,
            estado: true,
            contador_registros: 1,
            anos_cursados: estudiante.anos_cursados,
            semestre: estudiante.semestre,
            rol_id: 3
          });
          nuevosEstudiantes++;
          resultados.push({
            rut: estudiante.rut,
            mensaje: `Estudiante creado exitosamente con ID: ${ultimoId}`
          });
        }
      } catch (error) {
        console.error('Error al procesar estudiante:', error);
        errores.push({
          rut: estudiante.rut,
          error: `Error al procesar: ${error.message}`
        });
      }
    }

    res.status(200).json({
      mensaje: 'Proceso de carga masiva completado',
      resultados,
      errores,
      total_procesados: estudiantes.length,
      nuevos_estudiantes: nuevosEstudiantes,
      estudiantes_actualizados: estudiantesActualizados,
      fallidos: errores.length
    });

  } catch (error) {
    console.error('Error en carga masiva:', error);
    res.status(500).json({
      error: 'Error al procesar la carga masiva de estudiantes',
      detalles: error.message
    });
  }
};

// Función auxiliar para formatear el RUT
function formatearRUT(rut) {
  // Eliminar puntos y guiones si existen
  rut = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Separar cuerpo y dígito verificador
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();
  
  // Retornar RUT formateado
  return `${cuerpo}-${dv}`;
}

export const actualizarEstudiantesMasivo = async (req, res) => {
  try {
    const { id, cambios } = req.body;

    // Primero verificamos que todos los estudiantes existan
    const estudiantes = await Estudiante.findAll({
      where: {
        id: {
          [Op.in]: id
        }
      }
    });
    
    // Si no encontramos la misma cantidad de estudiantes que IDs enviados
    if (estudiantes.length !== id.length) {
      const estudiantesNoEncontrados = id.filter(idEstudiante => 
        !estudiantes.some(e => e.id === idEstudiante)
      );
      
      return res.status(404).json({
        error: 'Uno o más estudiantes no fueron encontrados',
        estudiantesNoEncontrados: estudiantesNoEncontrados
      });
    }

    // Si todos existen, procedemos con la actualización
    const actualizaciones = await Estudiante.update(cambios, {
      where: {
        id: {
          [Op.in]: id
        }
      }
    });

    res.status(200).json({
      mensaje: 'Estudiantes actualizados exitosamente',
      estudiantes_actualizados: actualizaciones[0]
    });

  } catch (error) {
    console.error('Error en actualización masiva:', error);
    res.status(500).json({
      error: 'Error al actualizar estudiantes',
      detalles: error.message
    });
  }
};

  export const obtenerEstudiantes = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', ano = '', semestre = '', estado } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};

      // Filtro por estado
      if (estado === 'activos') {
        whereClause.estado = true;
      } else if (estado === 'inactivos') {
        whereClause.estado = false;
      }
      // Si estado es 'todos' o no se proporciona, no se aplica filtro de estado

      if (search) {
        whereClause[Op.or] = [
          { nombres: { [Op.like]: `%${search}%` } },
          { apellidos: { [Op.like]: `%${search}%` } },
          { rut: { [Op.like]: `%${search}%` } }
        ];
      }

      if (ano) {
        whereClause.anos_cursados = {
          [Op.like]: `%${ano}%`
        };
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
  
      // Obtener el último estudiante para determinar el siguiente ID
      const ultimoEstudiante = await Estudiante.findOne({
        order: [['id', 'DESC']]
      });
      
      const siguienteId = ultimoEstudiante ? ultimoEstudiante.id + 1 : 1;
  
      const hashedPassword = await bcrypt.hash(contrasena, 10);
  
      const nuevoEstudiante = await Estudiante.create({
        id: siguienteId, // Asignamos el ID manualmente
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
        rol_id: 3
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

  export const getMe = async (req, res) => {
    try {
      const userId = req.user.id; // Suponiendo que el middleware de verificación establece req.user
      let usuario = await Usuario.findByPk(userId);
      
      if (!usuario) {
        usuario = await Estudiante.findByPk(userId);
      }
  
      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }
  
      res.json(usuario);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error al obtener los datos del usuario' });
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