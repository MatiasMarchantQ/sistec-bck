// controllers/estudianteController.js
import Estudiante from '../models/Estudiante.js';
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { enviarCredencialesEstudiante } from '../services/emailService.js'
import pLimit from 'p-limit'; // Librería para limitar concurrencia

export const enviarCredencialesMasivo = async (req, res) => {
  try {
    const { ano_cursado } = req.body;

    // Buscar estudiantes
    const estudiantes = await Estudiante.findAll({
      where: {
        anos_cursados: {
          [Op.like]: `%${ano_cursado}%`
        },
        estado: true,
        debe_cambiar_contrasena: true
      }
    });

    if (estudiantes.length === 0) {
      return res.status(404).json({
        mensaje: `No se encontraron estudiantes para el año ${ano_cursado}`
      });
    }

    // Iniciar respuesta inmediata
    res.status(200).json({
      mensaje: 'Proceso de envío iniciado',
      total_estudiantes: estudiantes.length
    });

    // Configurar límite de concurrencia
    const limit = pLimit(5); // Máximo 5 envíos simultáneos
    const INTERVALO_ENTRE_LOTES = 2000; // 2 segundos entre lotes

    const resultados = [];
    const errores = [];

    // Procesar en lotes
    const procesarLote = async (lote) => {
      const promesas = lote.map(estudiante => 
        limit(async () => {
          try {
            // Generar contraseña temporal si no tiene
            const contrasenatemporal = estudiante.contrasena || 
              generarContrasenaTemporalSegura();

            // Enviar credenciales
            await enviarCredencialesEstudiante(estudiante, contrasenatemporal);

            resultados.push({
              rut: estudiante.rut,
              correo: estudiante.correo,
              nombres: estudiante.nombres,
              apellidos: estudiante.apellidos,
              mensaje: 'Credenciales enviadas exitosamente'
            });
          } catch (error) {
            console.error(`Error enviando credenciales a ${estudiante.correo}:`, error);
            errores.push({
              rut: estudiante.rut,
              correo: estudiante.correo,
              error: error.message
            });
          }
        })
      );

      return Promise.all(promesas);
    };

    // Procesar en lotes de 10
    const TAMAÑO_LOTE = 10;
    for (let i = 0; i < estudiantes.length; i += TAMAÑO_LOTE) {
      const lote = estudiantes.slice(i, i + TAMAÑO_LOTE);
      
      await procesarLote(lote);
      
      // Pequeña pausa entre lotes para evitar sobrecargar el servidor de correo
      await new Promise(resolve => setTimeout(resolve, INTERVALO_ENTRE_LOTES));
    }

  } catch (error) {
    console.error('Error en envío masivo de credenciales:', error);
  }
};

// Función para generar contraseña temporal segura
const generarContrasenaTemporalSegura = (longitudMinima = 12, longitudMaxima = 16) => {
  const caracteresMayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const caracteresMinusculas = 'abcdefghijklmnopqrstuvwxyz';
  const caracteresNumeros = '0123456789';
  const caracteresEspeciales = '!@#$%^&*()';
  
  // Asegurarse de que la longitud esté dentro de los límites
  const longitudContrasena = Math.floor(Math.random() * (longitudMaxima - longitudMinima + 1)) + longitudMinima;
  
  let contrasena = '';
  
  // Asegurarse de incluir al menos un carácter de cada tipo
  contrasena += caracteresMayusculas[Math.floor(Math.random() * caracteresMayusculas.length)];
  contrasena += caracteresMinusculas[Math.floor(Math.random() * caracteresMinusculas.length)];
  contrasena += caracteresNumeros[Math.floor(Math.random() * caracteresNumeros.length)];
  contrasena += caracteresEspeciales[Math.floor(Math.random() * caracteresEspeciales.length)];
  
  // Rellenar el resto de la contraseña con caracteres aleatorios
  const todosLosCaracteres = caracteresMayusculas + caracteresMinusculas + caracteresNumeros + caracteresEspeciales;
  for (let i = contrasena.length; i < longitudContrasena; i++) {
    const indiceAleatorio = Math.floor(Math.random() * todosLosCaracteres.length);
    contrasena += todosLosCaracteres[indiceAleatorio];
  }
  
  // Mezclar la contraseña para que los caracteres no estén en un orden predecible
  contrasena = contrasena.split('').sort(() => Math.random() - 0.5).join('');
  
  return contrasena;
};

export const cambiarContrasenaEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaContrasena } = req.body;

    // Validación de la nueva contraseña
    const regexContrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/; // Al menos una minúscula, una mayúscula, un número y longitud entre 8 y 20
    if (!regexContrasena.test(nuevaContrasena)) {
      return res.status(400).json({ error: 'La nueva contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y tener entre 8 y 20 caracteres.' });
    }

    const estudiante = await Estudiante.findByPk(id);
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Generar nueva contraseña hasheada
    const salt = await bcrypt.genSalt(10);
    const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, salt);

    // Actualizar contraseña hasheada y el estado de debe_cambiar_contrasena
    await estudiante.update({
      contrasena: nuevaContrasenaHash,
      debe_cambiar_contrasena: false
    });

    // // Enviar correo de notificación con la nueva contraseña
    // await enviarCredencialesEstudiante(estudiante, nuevaContrasena);

    res.status(200).json({ mensaje: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error al cambiar contraseña',
      detalles: error.message
    });
  }
};

export const enviarCredencialIndividual = async (req, res) => {
  try {
    const { id } = req.params;

    const estudiante = await Estudiante.findByPk(id);
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Verificar que el estado del estudiante no sea 0
    if (estudiante.estado === 0) {
      return res.status(403).json({ error: 'No se puede enviar credenciales a un estudiante inactivo' });
    }

    // SIEMPRE generar una nueva contraseña temporal
    const contrasenatemporal = generarContrasenaTemporalSegura();
    
    // Actualizar contraseña del estudiante
    await estudiante.update({
      contrasena: contrasenatemporal,
      debe_cambiar_contrasena: true
    });

    // Enviar credenciales con la nueva contraseña temporal
    await enviarCredencialesEstudiante(estudiante, contrasenatemporal);

    res.status(200).json({ 
      mensaje: 'Credenciales enviadas exitosamente',
      correo: estudiante.correo,
      rut: estudiante.rut,
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      debe_cambiar_contrasena: true // Siempre será true al generar nueva contraseña
    });
  } catch (error) {
    console.error('Error al enviar credenciales:', error);
    res.status(500).json({
      error: 'Error al enviar credenciales',
      detalles: error.message
    });
  }
};

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
              correo: estudiante.correo
            });
            resultados.push({
              rut: estudiante.rut,
              mensaje: `Estudiante existente actualizado, año ${nuevoAno} ya registrado`
            });
          }
        } else {
          ultimoId++;
          
          // Crear nuevo estudiante con ID específico
          const nuevoEstudiante = await Estudiante.create({
            id: ultimoId, // Especificamos el ID
            nombres: estudiante.nombres,
            apellidos: estudiante.apellidos,
            rut: estudiante.rut,
            correo: estudiante.correo,
            contrasena: estudiante.contrasena, // Sin hashear
            debe_cambiar_contrasena: true,
            estado: true,
            contador_registros: 1,
            anos_cursados: estudiante.anos_cursados,
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

    // Verificar si el correo ya existe en los cambios
    for (const estudiante of estudiantes) {
      if (cambios.correo && cambios.correo !== estudiante.correo) {
        const correoExistente = await Estudiante.findOne({
          where: {
            correo: cambios.correo,
            id: { [Op.ne]: estudiante.id } // Ignorar el estudiante que se está actualizando
          }
        });
        
        if (correoExistente) {
          return res.status(400).json({ 
            error: `El correo ${cambios.correo} ya está registrado en el sistema` 
          });
        }
      }
    }

    // Si todos existen y no hay conflictos de correo, procedemos con la actualización
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
    const { page = 1, limit = 10, search = '', ano = '', estado } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Filtro por estado
    if (estado === 'activos') {
      whereClause.estado = true;
    } else if (estado === 'inactivos') {
      whereClause.estado = false;
    }

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
    const { nombres, apellidos, rut, correo, contrasena, anos_cursados } = req.body;

    // Verificar si el RUT ya existe
    const estudianteExistente = await Estudiante.findOne({ 
      where: { rut } 
    });
    
    // Verificar si el correo ya existe en Estudiantes o Usuarios
    const correoExistenteEstudiante = await Estudiante.findOne({ 
      where: { correo } 
    });
    
    const correoExistenteUsuario = await Usuario.findOne({ 
      where: { correo } 
    });

    // Validaciones
    if (estudianteExistente) {
      return res.status(400).json({ error: 'El RUT ya está registrado' });
    }

    if (correoExistenteEstudiante || correoExistenteUsuario) {
      return res.status(400).json({ 
        error: 'El correo electrónico ya está registrado en el sistema',
        detalles: correoExistenteEstudiante 
          ? 'Registrado como estudiante' 
          : 'Registrado como usuario'
      });
    }

    // Obtener el último estudiante para determinar el siguiente ID
    const ultimoEstudiante = await Estudiante.findOne({
      order: [['id', 'DESC']]
    });
    
    const siguienteId = ultimoEstudiante ? ultimoEstudiante.id + 1 : 1;

    const nuevoEstudiante = await Estudiante.create({
      id: siguienteId,
      nombres,
      apellidos,
      rut,
      correo,
      contrasena,
      debe_cambiar_contrasena: true,
      estado: true,
      contador_registros:  1,
      anos_cursados,
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
        anos_cursados: nuevoEstudiante.anos_cursados
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
      const { nombres, apellidos, correo, anos_cursados, estado } = req.body;
  
      const estudiante = await Estudiante.findByPk(id);
      if (!estudiante) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }
  
      // Si se intenta cambiar el correo, verificar que no exista en otras tablas
      if (correo && correo !== estudiante.correo) {
        const correoExistenteEstudiante = await Estudiante.findOne({ 
          where: { 
            correo, 
            id: { [Op.ne]: id } // Excluir el estudiante actual
          } 
        });
        
        const correoExistenteUsuario = await Usuario.findOne({ 
          where: { correo } 
        });
  
        if (correoExistenteEstudiante || correoExistenteUsuario) {
          return res.status(400).json({ 
            error: 'El correo electrónico ya está registrado en el sistema',
            detalles: correoExistenteEstudiante 
              ? 'Registrado como estudiante' 
              : 'Registrado como usuario'
          });
        }
      }
  
      // Crear un objeto con los campos a actualizar
      const camposActualizar = {};
      
      // Solo incluir los campos que vienen en el body
      if (nombres !== undefined) camposActualizar.nombres = nombres;
      if (apellidos !== undefined) camposActualizar.apellidos = apellidos;
      if (correo !== undefined) camposActualizar.correo = correo;
      if (anos_cursados !== undefined) camposActualizar.anos_cursados = anos_cursados;
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