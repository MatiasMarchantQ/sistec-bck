import PacienteAdulto from '../models/PacienteAdulto.js';
import FichaClinicaAdulto from '../models/FichaClinicaAdulto.js';
import PacienteInfantil from '../models/PacienteInfantil.js';
import FichaClinicaInfantil from '../models/FichaClinicaInfantil.js';
import NivelEscolaridad from '../models/NivelEscolaridad.js';
import CicloVitalFamiliar from '../models/CicloVitalFamiliar.js';
import TipoFamilia from '../models/TipoFamilia.js';
import FichaCicloVital from '../models/FichaCicloVital.js';  // Añade esta línea
import FichaTipoFamilia from '../models/FichaTipoFamilia.js';  // Añade esta línea si no está
import FactorRiesgoNino from '../models/FactorRiesgoNino.js';
import FactorRiesgoFamiliar from '../models/FactorRiesgoFamiliar.js';
import FichaFactorRiesgoNino from '../models/FichaFactorRiesgoNino.js';
import FichaFactorRiesgoFamiliar from '../models/FichaFactorRiesgoFamiliar.js';
import PadreTutor from '../models/PadreTutor.js';
import TipoInstitucion from '../models/TipoInstitucion.js';
import Institucion from '../models/Institucion.js';
import Diagnostico from '../models/Diagnostico.js';
import Usuario from '../models/Usuario.js';
import sequelize from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import Estudiante from '../models/Estudiante.js';

export const getFichasClinicasPorInstitucion = async (req, res) => {
    try {
        const { institucionId } = req.params;
        const { rol_id, estudiante_id } = req.user;

        // Parámetros de búsqueda
        const busqueda = req.query.search ? req.query.search.trim() : '';

        let whereClause = { institucion_id: institucionId };

        if (rol_id === 3) {
            whereClause.estudiante_id = estudiante_id;
        }

        // Preparar condiciones de búsqueda para pacientes adultos
        const whereAdultos = {
            ...whereClause,
            ...(busqueda && {
                [Op.or]: [
                    sequelize.where(
                        sequelize.fn('LOWER',
                            sequelize.fn('CONCAT',
                                sequelize.col('PacienteAdulto.nombres'),
                                ' ',
                                sequelize.col('PacienteAdulto.apellidos')
                            )
                        ),
                        {
                            [Op.like]: `%${busqueda.toLowerCase()}%`
                        }
                    ),
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('PacienteAdulto.rut')),
                        { [Op.like]: `%${busqueda.toLowerCase()}%` }
                    )
                ]
            })
        };

        // Preparar condiciones de búsqueda para pacientes infantiles
        const whereInfantiles = {
            ...whereClause,
            ...(busqueda && {
                [Op.or]: [
                    sequelize.where(
                        sequelize.fn('LOWER',
                            sequelize.fn('CONCAT',
                                sequelize.col('PacienteInfantil.nombres'),
                                ' ',
                                sequelize.col('PacienteInfantil.apellidos')
                            )
                        ),
                        {
                            [Op.like]: `%${busqueda.toLowerCase()}%`
                        }
                    ),
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('PacienteInfantil.rut')),
                        { [Op.like]: `%${busqueda.toLowerCase()}%` }
                    )
                ]
            })
        };

        // Obtener todas las fichas de adultos
        const fichasAdultos = await FichaClinicaAdulto.findAll({
            where: whereAdultos,
            include: [
                {
                    model: PacienteAdulto,
                    attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad']
                },
                {
                    model: Diagnostico,
                    attributes: ['id', 'nombre'],
                    as: 'diagnostico'
                },
            ],
            order: [['createdAt', 'DESC']]
        });

        // Obtener todas las fichas infantiles
        const fichasInfantiles = await FichaClinicaInfantil.findAll({
            where: whereInfantiles,
            include: [
                {
                    model: PacienteInfantil,
                    attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad']
                },
                {
                    model: PadreTutor,
                    as: 'padresTutores',
                    include: [{
                        model: NivelEscolaridad,
                        as: 'nivelEscolaridad'
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Formatear fichas de adultos
        const fichasAdultosFormateadas = fichasAdultos.map(ficha => ({
            id: ficha.id,
            tipo: 'adulto',
            fecha: ficha.fecha_evaluacion,
            paciente: {
                nombres: ficha.PacienteAdulto.nombres,
                apellidos: ficha.PacienteAdulto.apellidos,
                rut: ficha.PacienteAdulto.rut,
                edad: ficha.PacienteAdulto.edad
            },
            diagnostico: {
                id: ficha.diagnostico_id,
                nombre: ficha.diagnostico && ficha.diagnostico.nombre ? ficha.diagnostico.nombre : ficha.diagnostico_otro,
            },
            createdAt: ficha.createdAt,
            updatedAt: ficha.updatedAt
        }));

        // Formatear fichas infantiles
        const fichasInfantilesFormateadas = fichasInfantiles.map(ficha => ({
            id: ficha.id,
            tipo: 'infantil',
            fecha: ficha.createdAt,
            paciente: {
                nombres: ficha.PacienteInfantil.nombres,
                apellidos: ficha.PacienteInfantil.apellidos,
                rut: ficha.PacienteInfantil.rut,
                edad: ficha.PacienteInfantil.edad
            },
            diagnostico: {
                id: null,
                nombre: ficha.diagnostico_dsm || 'Sin diagnóstico'
            },
            createdAt: ficha.createdAt,
            updatedAt: ficha.updatedAt
        }));

        // Combinar todas las fichas
        const todasLasFichas = [...fichasAdultosFormateadas, ...fichasInfantilesFormateadas];

        // Ordenar las fichas combinadas por createdAt
        todasLasFichas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Calcular el total de registros
        const totalRegistros = todasLasFichas.length;

        // Parámetros de paginación
        const page = Math.max(1, parseInt(req.query.page)) || 1; // Asegura que page sea al menos 1
        const limit = parseInt(req.query.limit) || 10; // Cambiar a 10 para el límite
        const offset = (page - 1) * limit; // Esto será 0 si page es 1

        // Aplicar paginación
        const paginadas = todasLasFichas.slice(offset, offset + limit);

        // Calcular información de paginación
        const totalPaginas = Math.ceil(totalRegistros / limit);
        const paginaActual = page;

        res.json({
            success: true,
            data: paginadas,
            pagination: {
                totalRegistros,
                totalPaginas,
                paginaActual,
                registrosPorPagina: limit,
                terminoBusqueda: busqueda
            }
        });

    } catch (error) {
        console.error('Error al obtener fichas clínicas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las fichas clínicas',
            error: error.message
        });
    }
};

export const createFichaClinicaAdulto = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            nombres,
            apellidos,
            rut,
            edad,
            diagnostico_id,
            diagnostico_otro,
            escolaridad,
            ocupacion,
            direccion,
            conQuienVive,
            tiposFamilia,
            tipoFamiliaOtro,
            ciclo_vital_familiar_id,
            telefonoPrincipal,
            telefonoSecundario,
            horarioLlamada,
            conectividad,
            valorHbac1,
            factoresRiesgo,
            estudiante_id,
            usuario_id,
            institucion_id,
            isReevaluacion = 0
        } = req.body;

        // Validación de IDs
        if (!estudiante_id && !usuario_id) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere al menos un ID (estudiante o usuario) para crear la ficha clínica'
            });
        }

        // Validación de diagnóstico
        if (!diagnostico_id && !diagnostico_otro) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar un diagnóstico (predefinido o personalizado)'
            });
        }

        // Si se proporciona un ID de diagnóstico, validar que exista
        if (diagnostico_id) {
            const diagnosticoExistente = await Diagnostico.findByPk(diagnostico_id, { transaction: t });
            if (!diagnosticoExistente) {
                throw new Error('Diagnóstico seleccionado no válido');
            }
        }

        // Crear o actualizar paciente
        const [paciente, created] = await PacienteAdulto.findOrCreate({
            where: { rut },
            defaults: {
                nombres,
                apellidos,
                edad,
                fecha_nacimiento: new Date(),
                telefono_principal: telefonoPrincipal,
                telefono_secundario: telefonoSecundario
            },
            transaction: t
        });

        if (!created) {
            await paciente.update({
                nombres,
                apellidos,
                edad,
                telefono_principal: telefonoPrincipal,
                telefono_secundario: telefonoSecundario
            }, { transaction: t });
        }

        // Obtener o crear el nivel de escolaridad
        const nivelEscolaridad = await NivelEscolaridad.findByPk(escolaridad, { transaction: t });
        if (!nivelEscolaridad) {
            throw new Error('Nivel de escolaridad no válido');
        }

        // Crear la ficha clínica
        const fichaClinica = await FichaClinicaAdulto.create({
            paciente_id: paciente.id,
            fecha_evaluacion: new Date(),
            diagnostico_id: diagnostico_id || null,
            diagnostico_otro: diagnostico_otro || null,
            escolaridad_id: nivelEscolaridad.id,
            ocupacion,
            direccion,
            con_quien_vive: conQuienVive,
            ciclo_vital_familiar_id,
            horario_llamada: horarioLlamada,
            conectividad,
            valor_hbac1: parseFloat(valorHbac1),
            alcohol_drogas: factoresRiesgo.alcoholDrogas,
            tabaquismo: factoresRiesgo.tabaquismo,
            otros_factores: factoresRiesgo.otros,
            estudiante_id: estudiante_id || null,
            usuario_id: usuario_id || null,
            institucion_id,
            is_reevaluacion: isReevaluacion
        }, { transaction: t });

        // Manejo de tipos de familia
        if (tiposFamilia && tiposFamilia.length > 0) {
            await Promise.all(tiposFamilia.map(async (tipoId) => {
                await FichaTipoFamilia.create({
                    ficha_clinica_id: fichaClinica.id,
                    tipo_familia_id: tipoId,
                    tipo_familia_otro: tipoFamiliaOtro || null, // Guardar el campo "Otras" si se proporciona
                    tipo_ficha: 'adulto'
                }, { transaction: t });
            }));
        }

        await t.commit();

        res.status(201).json({
            success: true,
            message: 'Ficha clínica creada exitosamente',
            data: {
                fichaClinica,
                paciente,
                requestData: req.body
            }
        });

    } catch (error) {
        await t.rollback();
        console.error('Error al crear ficha clínica:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la ficha clínica',
            error: error.message
        });
    }
};

export const createFichaClinicaInfantil = async (req, res) => {
    const t = await sequelize.transaction();
  
    try {
      const {
        fechaNacimiento,
        nombres,
        apellidos,
        rut,
        edad,
        telefonoPrincipal,
        telefonoSecundario,
        puntajeDPM,
        diagnosticoDSM,
        padres,
        conQuienVive,
        tipoFamilia,
        tipoFamiliaOtro,
        cicloVitalFamiliar,
        localidad,
        factoresRiesgoNino,
        factoresRiesgoFamiliares,
        otrosFactoresRiesgoFamiliares,
        estudiante_id,
        usuario_id,
        institucion_id
      } = req.body;
  
      // Crear o actualizar paciente
      const [paciente, created] = await PacienteInfantil.findOrCreate({
        where: { rut },
        defaults: {
          nombres,
          apellidos,
          fecha_nacimiento: fechaNacimiento,
          edad,
          telefono_principal: telefonoPrincipal,
          telefono_secundario: telefonoSecundario
        },
        transaction: t
      });
  
      // Crear la ficha clínica
      const fichaClinica = await FichaClinicaInfantil.create({
        paciente_id: paciente.id,
        puntaje_dpm: puntajeDPM,
        diagnostico_dsm: diagnosticoDSM,
        con_quien_vive: conQuienVive,
        ciclo_vital_familiar_id: cicloVitalFamiliar,
        localidad,
        estudiante_id,
        usuario_id,
        institucion_id
      }, { transaction: t });

      // Guardar tipo de familia
      await FichaTipoFamilia.create({
        ficha_clinica_id: fichaClinica.id,
        tipo_familia_id: tipoFamilia !== 'Otras' ? tipoFamilia : null, // Guardar ID o null
        tipo_familia_otro: tipoFamilia === 'Otras' ? tipoFamiliaOtro : null, // Guardar el texto ingresado
        tipo_ficha: 'infantil'
    }, { transaction: t });
  
      // Guardar factores de riesgo del niño
    if (factoresRiesgoNino && factoresRiesgoNino.length > 0) {
        const factoresNino = await FactorRiesgoNino.findAll({
          where: { nombre: factoresRiesgoNino },
          transaction: t
        });
        await fichaClinica.setFactoresRiesgoNinoInfantil(factoresNino, { transaction: t });
      }

      // Obtener el ID del factor "Otras"
      const factorOtras = await FactorRiesgoFamiliar.findOne({
        where: { nombre: 'Otras' },
        transaction: t
    });
  
    // Guardar factores de riesgo familiares
    if (factoresRiesgoFamiliares && factoresRiesgoFamiliares.length > 0) {
        for (const factorNombre of factoresRiesgoFamiliares) {
            const factor = await FactorRiesgoFamiliar.findOne({
                where: { nombre: factorNombre }
            });

            if (factor) {
                await FichaFactorRiesgoFamiliar.create({
                    ficha_clinica_id: fichaClinica.id,
                    factor_riesgo_familiar_id: factor.id,
                    otras: factor.nombre === 'Otras' ? otrosFactoresRiesgoFamiliares : null // Guardar el texto ingresado
                }, { transaction: t });
            }
        }
    }

    // Si hay un campo "Otras" que se está usando para texto adicional
    if (otrosFactoresRiesgoFamiliares && otrosFactoresRiesgoFamiliares.trim() !== '') {
        await FichaFactorRiesgoFamiliar.create({
            ficha_clinica_id: fichaClinica.id,
            factor_riesgo_familiar_id: factorOtras ? factorOtras.id : null, // No se asocia a un ID específico
            otras: otrosFactoresRiesgoFamiliares // Guarda el texto ingresado
        }, { transaction: t });
    }
  
    // Guardar información de los padres/tutores
    if (padres && padres.length > 0) {
        for (const padre of padres) {
        await PadreTutor.create({
            ficha_clinica_id: fichaClinica.id,
            nombre: padre.nombre,
            escolaridad_id: padre.escolaridad,
            ocupacion: padre.ocupacion
        }, { transaction: t });
        }
    }
  
    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Ficha clínica infantil creada exitosamente',
      data: {
        fichaClinica,
        paciente,
        requestData: req.body
      }
    });

} catch (error) {
    await t.rollback();
    console.error('Error al crear ficha clínica infantil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la ficha clínica infantil',
      error: error.message
    });
  }
};

export const getFichaClinicaInfantil = async (req, res) => {
    try {
        const { id } = req.params;
        
        const fichaClinica = await FichaClinicaInfantil.findByPk(id, {
            include: [
                {
                    model: PacienteInfantil,
                    attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad', 'telefono_principal', 'telefono_secundario']
                },
                {
                    model: CicloVitalFamiliar,
                    as: 'cicloVitalFamiliarInfantil',
                    attributes: ['id', 'ciclo']
                },
                {
                    model: TipoFamilia,
                    through: FichaTipoFamilia,
                    as: 'tiposFamiliaInfantil'
                },
                {
                    model: FactorRiesgoNino,
                    through: {
                        model: FichaFactorRiesgoNino,
                        attributes: []
                    },
                    as: 'factoresRiesgoNinoInfantil'
                },
                {
                    model: FactorRiesgoFamiliar,
                    through: {
                        model: FichaFactorRiesgoFamiliar,
                        attributes: ['otras']
                    },
                    as: 'factoresRiesgoFamiliarInfantil'
                },
                {
                    model: PadreTutor,
                    as: 'padresTutores',
                    include: [{
                        model: NivelEscolaridad,
                        as: 'nivelEscolaridad'
                    }]
                },
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombres', 'apellidos', 'correo']
                },
                {
                    model: Estudiante,
                    as: 'estudiante',
                    attributes: ['id', 'nombres','apellidos', 'correo']
                },
                {
                    model: Institucion,
                    as: 'institucion',
                    attributes: ['id', 'nombre']
                },
            ]
        });

        if (!fichaClinica) {
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica infantil no encontrada'
            });
        }

        const fichaFormateada = formatearFichaInfantil(fichaClinica);

        // Agregar un log para verificar la ficha formateada
        console.log('Ficha clínica infantil formateada:', fichaFormateada);


        res.json({
            success: true,
            data: fichaFormateada
        });

    } catch (error) {
        console.error('Error al obtener ficha clínica infantil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la ficha clínica infantil',
            error: error.message
        });
    }
};


export const updateFichaClinicaInfantil = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;
        const updateData = req.body;

        const fichaClinica = await FichaClinicaInfantil.findByPk(id);
        if (!fichaClinica) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica infantil no encontrada'
            });
        }

        // Actualizar la ficha clínica
        await fichaClinica.update(updateData, { transaction: t });

        // Actualizar factores de riesgo del niño
        if (updateData.factoresRiesgoNino) {
            await FichaFactorRiesgoNino.destroy({ where: { ficha_clinica_id: id }, transaction: t });
            for (const factor in updateData.factoresRiesgoNino) {
                if (updateData.factoresRiesgoNino[factor]) {
                    const factorRiesgo = await FactorRiesgoNino.findOne({ where: { nombre: factor }, transaction: t });
                    if (factorRiesgo) {
                        await FichaFactorRiesgoNino.create({
                            ficha_clinica_id: fichaClinica.id,
                            factor_riesgo_nino_id: factorRiesgo.id
                        }, { transaction: t });
                    }
                }
            }
        }

        // Actualizar factores de riesgo familiares
        if (updateData.factoresRiesgoFamiliares) {
            await FichaFactorRiesgoFamiliar.destroy({ where: { ficha_clinica_id: id }, transaction: t });
            for (const factor in updateData.factoresRiesgoFamiliares) {
                if (updateData.factoresRiesgoFamiliares[factor]) {
                    const factorRiesgo = await FactorRiesgoFamiliar.findOne({ where: { nombre: factor }, transaction: t });
                    if (factorRiesgo) {
                        await FichaFactorRiesgoFamiliar.create({
                            ficha_clinica_id: fichaClinica.id,
                            factor_riesgo_familiar_id: factorRiesgo.id
                        }, { transaction: t });
                    }
                }
            }
        }

        await t.commit();

        res.json({
            success: true,
            message: 'Ficha clínica infantil actualizada exitosamente',
            data: fichaClinica
        });

    } catch (error) {
        await t.rollback();
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la ficha clínica infantil',
            error: error.message
        });
    }
};

export const getFichaClinica = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo } = req.query;

        if (!tipo || (tipo !== 'adulto' && tipo !== 'infantil')) {
            return res.status(400).json({
                success: false,
                message: 'Debe especificar un tipo válido (adulto o infantil)'
            });
        }

        let fichaClinica;
        let fichaFormateada;

        if (tipo === 'adulto') {
            fichaClinica = await FichaClinicaAdulto.findByPk(id, {
                include: [
                    {
                        model: PacienteAdulto,
                        attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad', 'telefono_principal', 'telefono_secundario']
                    },
                    {
                        model: Diagnostico,
                        as: 'diagnostico',
                        attributes: ['id', 'nombre'],
                    },
                    {
                        model: CicloVitalFamiliar,
                        as: 'cicloVitalFamiliarAdulto',
                        attributes: ['id', 'ciclo']
                    },
                    {
                        model: TipoFamilia,
                        through: FichaTipoFamilia,
                        as: 'tiposFamilia'
                    },
                    {
                        model: NivelEscolaridad,
                        as: 'NivelEscolaridad'
                    },
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'nombres', 'apellidos', 'correo']
                    },
                    {
                        model: Estudiante,
                        as: 'estudiante',
                        attributes: ['id', 'nombres','apellidos', 'correo']
                    },
                    {
                        model: Institucion,
                        as: 'institucion',
                        attributes: ['id', 'nombre']
                    }
                ]
            });

            if (fichaClinica) {
                fichaFormateada = formatearFichaAdulto(fichaClinica);
            }
        } else {
            fichaClinica = await FichaClinicaInfantil.findByPk(id, {
                include: [
                    {
                        model: PacienteInfantil,
                        attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad', 'telefono_principal', 'telefono_secundario']
                    },
                    {
                        model: CicloVitalFamiliar,
                        as: 'cicloVitalFamiliarInfantil',
                        attributes: ['id', 'ciclo']
                    },
                    {
                        model: FichaTipoFamilia,
                        as: 'fichasTipoFamiliaInfantiles',
                        include: [{
                            model: TipoFamilia,
                            as: 'tipoFamiliaInfantil', // Aquí se usa el alias correcto
                            attributes: ['id', 'nombre'] // Agrega los atributos que necesites
                        }]
                    },
                    {
                        model: FactorRiesgoNino,
                        through: {
                            model: FichaFactorRiesgoNino,
                            attributes: []
                        },
                        as: 'factoresRiesgoNino'
                    },
                    {
                        model: FactorRiesgoFamiliar,
                        through: {
                            model: FichaFactorRiesgoFamiliar,
                            attributes: ['otras']
                        },
                        as: 'factoresRiesgoFamiliar'
                    },
                    {
                        model: PadreTutor,
                        as: 'padresTutores',
                        include: [{
                            model: NivelEscolaridad,
                            as: 'nivelEscolaridad'
                        }]
                    },
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'nombres', 'apellidos', 'correo']
                    },
                    {
                        model: Estudiante,
                        as: 'estudiante',
                        attributes: ['id', 'nombres','apellidos', 'correo']
                    },
                    {
                        model: Institucion,
                        as: 'institucion',
                        attributes: ['id', 'nombre']
                    }
                ]
            });

            if (fichaClinica) {
                fichaFormateada = formatearFichaInfantil(fichaClinica);
            }
        }

        if (!fichaClinica) {
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica no encontrada'
            });
        }

        res.json({
            success: true,
            data: fichaFormateada
        });

    } catch (error) {
        console.error('Error al obtener ficha clínica:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la ficha clínica',
            error: error.message
        });
    }
};

function formatearFichaAdulto(fichaClinica) {
    return {
        id: fichaClinica.id,
        fecha: fichaClinica.fecha_evaluacion,
        paciente: {
            id: fichaClinica.PacienteAdulto.id,
            nombres: fichaClinica.PacienteAdulto.nombres,
            apellidos: fichaClinica.PacienteAdulto.apellidos,
            rut: fichaClinica.PacienteAdulto.rut,
            edad: fichaClinica.PacienteAdulto.edad,
            telefonoPrincipal: fichaClinica.PacienteAdulto.telefono_principal,
            telefonoSecundario: fichaClinica.PacienteAdulto.telefono_secundario
        },
        diagnostico: {
            id: fichaClinica.diagnostico_id,
            nombre: fichaClinica.diagnostico && fichaClinica.diagnostico.nombre ? fichaClinica.diagnostico.nombre : fichaClinica.diagnostico_otro,
        },
        escolaridad: {
            id: fichaClinica.NivelEscolaridad?.id,
            nivel: fichaClinica.NivelEscolaridad?.nivel
        },
        ocupacion: fichaClinica.ocupacion,
        direccion: fichaClinica.direccion,
        conQuienVive: fichaClinica.con_quien_vive,
        horarioLlamada: fichaClinica.horario_llamada,
        conectividad: fichaClinica.conectividad,
        factoresRiesgo: {
            valorHbac1: fichaClinica.valor_hbac1,
            alcoholDrogas: fichaClinica.alcohol_drogas,
            tabaquismo: fichaClinica.tabaquismo,
            otros: fichaClinica.otros_factores
        },
        cicloVitalFamiliar: fichaClinica.cicloVitalFamiliarAdulto
                ? {
                    id: fichaClinica.cicloVitalFamiliarAdulto?.id,
                    ciclo: fichaClinica.cicloVitalFamiliarAdulto?.ciclo
                } 
                : null,
        tiposFamilia: fichaClinica.tiposFamilia.map(t => ({
            id: t.id,
            nombre: t.nombre
        })),
        estudiante: fichaClinica.estudiante ? {
            id: fichaClinica.estudiante.id,
            nombres: fichaClinica.estudiante.nombres,
            apellidos: fichaClinica.estudiante.apellidos,
            email: fichaClinica.estudiante.email
        } : null,
        usuario: fichaClinica.usuario ? {
            id: fichaClinica.usuario.id,
            nombres: fichaClinica.usuario.nombres,
            apellidos: fichaClinica.usuario.apellidos,
            email: fichaClinica.usuario.email
        } : null,
        institucion: fichaClinica.institucion ? {
            id: fichaClinica.institucion.id,
            nombre: fichaClinica.institucion.nombre
        } : null,
        createdAt: fichaClinica.createdAt,
        updatedAt: fichaClinica.updatedAt
    };
}

function formatearFichaInfantil(fichaClinica) {
    return {
        id: fichaClinica.id,
        paciente: {
            id: fichaClinica.PacienteInfantil?.id,
            nombres: fichaClinica.PacienteInfantil?.nombres,
            apellidos: fichaClinica.PacienteInfantil?.apellidos,
            rut: fichaClinica.PacienteInfantil?.rut,
            edad: fichaClinica.PacienteInfantil?.edad,
            telefonoPrincipal: fichaClinica.PacienteInfantil?.telefono_principal,
            telefonoSecundario: fichaClinica.PacienteInfantil?.telefono_secundario
        },
        evaluacionPsicomotora: {
            puntajeDPM: fichaClinica.puntaje_dpm,
            diagnosticoDSM: fichaClinica.diagnostico_dsm
        },
        informacionFamiliar: {
            conQuienVive: fichaClinica.con_quien_vive,
            tiposFamilia: (fichaClinica.fichasTipoFamiliaInfantiles || []).map(t => {
                return {
                    id: t.id || null,
                    nombre: t.tipoFamiliaInfantil?.nombre || (t.tipo_familia_otro ? t.tipo_familia_otro : 'No especificado')
                };
            }),
            cicloVitalFamiliar: fichaClinica.cicloVitalFamiliarInfantil 
                ? {
                    id: fichaClinica.cicloVitalFamiliarInfantil?.id,
                    ciclo: fichaClinica.cicloVitalFamiliarInfantil?.ciclo
                } 
                : null, // Cambiado a null si no hay ciclo vital familiar
            localidad: fichaClinica.localidad,
            padres: fichaClinica.padresTutores.map(padre => ({
                id: padre.id,
                nombre: padre.nombre,
                escolaridad: {
                    id: padre.nivelEscolaridad?.id,
                    nivel: padre.nivelEscolaridad?.nivel 
                },
                ocupacion: padre.ocupacion
            }))
        },
        factoresRiesgo: {
            nino: fichaClinica.factoresRiesgoNino.map(factor => ({
                id: factor.id,
                nombre: factor.nombre
            })),
            familiares: fichaClinica.factoresRiesgoFamiliar.map(factor => ({
                id: factor.id || null, // Asigna el id si existe, de lo contrario null
                nombre: factor.nombre || null,
                otras: factor.FichaFactorRiesgoFamiliar?.otras || null // Usa 'nombre' si 'id' existe, de lo contrario usa 'otras'
            }))
        },
        estudiante: fichaClinica.estudiante ? {
            id: fichaClinica.estudiante.id,
            nombres: fichaClinica.estudiante.nombres,
            apellidos: fichaClinica.estudiante.apellidos,
            email: fichaClinica.estudiante.email
        } : null,
        usuario: fichaClinica.usuario ? {
            id: fichaClinica.usuario.id,
            nombres: fichaClinica.usuario.nombres,
            apellidos: fichaClinica.usuario.apellidos,
            correo: fichaClinica.usuario.correo
        } : null,
        institucion: fichaClinica.institucion ? {
            id: fichaClinica.institucion.id,
            nombre: fichaClinica.institucion.nombre
        } : null,
        createdAt: fichaClinica.createdAt,
        updatedAt: fichaClinica.updatedAt
    };
}

export const updateFichaClinica = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;
        const updateData = req.body;

        const fichaClinica = await FichaClinicaAdulto.findByPk(id);
        if (!fichaClinica) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica no encontrada'
            });
        }

        // Actualizar nivel de escolaridad si es necesario
        if (updateData.escolaridad) {
            const [nivelEscolaridad] = await NivelEscolaridad.findOrCreate({
                where: { nivel: updateData.escolaridad },
                transaction: t
            });
            updateData.escolaridad_id = nivelEscolaridad.id;
            delete updateData.escolaridad;
        }

        // Actualizar ciclos vitales familiares
        if (updateData.ciclosVitalesFamiliares) {
            const ciclosVitales = await Promise.all(updateData.ciclosVitalesFamiliares.map(async (ciclo) => {
                const [cicloVital] = await CicloVitalFamiliar.findOrCreate({
                    where: { ciclo },
                    transaction: t
                });
                return cicloVital;
            }));
            await fichaClinica.setCiclosVitalesFamiliares(ciclosVitales, { transaction: t });
            delete updateData.ciclosVitalesFamiliares;
        }

        // Actualizar tipos de familia
        if (updateData.tiposFamilia) {
            const tiposFamiliaInstances = await Promise.all(updateData.tiposFamilia.map(async (tipo) => {
                const [tipoFamilia] = await TipoFamilia.findOrCreate({
                    where: { nombre: tipo },
                    transaction: t
                });
                return tipoFamilia;
            }));
            await fichaClinica.setTiposFamilia(tiposFamiliaInstances, { transaction: t });
            delete updateData.tiposFamilia;
        }

        // Actualizar factores de riesgo
        if (updateData.factoresRiesgo) {
            updateData.alcohol_drogas = updateData.factoresRiesgo.alcoholDrogas;
            updateData.tabaquismo = updateData.factoresRiesgo.tabaquismo;
            delete updateData.factoresRiesgo;
        }

        await fichaClinica.update(updateData, { transaction: t });

        await t.commit();

        res.json({
            success: true,
            message: 'Ficha clínica actualizada exitosamente',
            data: fichaClinica
        });

    } catch (error) {
        await t.rollback();
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la ficha clínica',
            error: error.message
        });
    }
};
export const obtenerFichasClinicas = async (req, res) => {
    try {
        const { 
            tipoInstitucion, 
            institucion, 
            textoBusqueda, 
            tipoFicha, 
            pagina = 1, 
            limite = 10 // Cambiar límite a 10
        } = req.query;

        // Condiciones base
        const whereConditions = {};
        let modelos = [];

        // Manejo de tipos de ficha
        if (!tipoFicha || tipoFicha === '') {
            modelos = [
                { modelo: FichaClinicaAdulto, pacienteModelo: PacienteAdulto },
                { modelo: FichaClinicaInfantil, pacienteModelo: PacienteInfantil }
            ];
        } else if (tipoFicha === 'adulto') {
            modelos = [{ modelo: FichaClinicaAdulto, pacienteModelo: PacienteAdulto }];
        } else if (tipoFicha === 'infantil') {
            modelos = [{ modelo: FichaClinicaInfantil, pacienteModelo: PacienteInfantil }];
        }

        // Filtro por institución (si se proporciona)
        if (institucion) {
            whereConditions.institucion_id = parseInt(institucion);
        }

        // Búsqueda de texto flexible
        const textConditions = textoBusqueda 
            ? {
                [Op.or]: [
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('nombres')), 
                        'LIKE', 
                        `%${textoBusqueda.toLowerCase()}%`
                    ),
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('apellidos')), 
                        'LIKE', 
                        `%${textoBusqueda.toLowerCase()}%`
                    ),
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('rut')), 
                        'LIKE', 
                        `%${textoBusqueda.toLowerCase()}%`
                    )
                ]
            }
            : {};

        // Realizar consulta con múltiples modelos
        const resultados = await Promise.all(
            modelos.map(async ({ modelo, pacienteModelo }) => {
                const includeConfig = [
                    {
                        model: pacienteModelo,
                        where: {
                            ...textConditions
                        },
                        required: true
                    },
                    {
                        model: Institucion,
                        include: [TipoInstitucion],
                        where: tipoInstitucion 
                            ? { tipo_id: parseInt(tipoInstitucion) } 
                            : {}
                    }
                ];

                // Agregar Diagnóstico solo para FichaClinicaAdulto
                if (modelo === FichaClinicaAdulto) {
                    includeConfig.push({
                        model: Diagnostico,
                        attributes: ['id', 'nombre'],
                        as: 'diagnostico',
                        required: false
                    });
                }

                return await modelo.findAndCountAll({
                    where: whereConditions,
                    include: includeConfig,
                    order: [['createdAt', 'DESC']],
                    distinct: true // Asegurarse de que se cuenten registros únicos
                });
            })
        );

        // Combinar resultados
        const fichas = resultados.flatMap(resultado => resultado.rows);
        const total = resultados.reduce((sum, resultado) => sum + resultado.count, 0);

        // Ordenar las fichas combinadas por createdAt
        const fichasOrdenadas = fichas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Configurar paginación
        const offset = (parseInt(pagina) - 1) * parseInt(limite);
        
        // Aplicar paginación a las fichas ordenadas
        const paginadas = fichasOrdenadas.slice(offset, offset + limite);

        res.json({
            success: true,
            total: total,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            fichas: paginadas // Devolver fichas paginadas y ordenadas
        });

    } catch (error) {
        console.error('Error detallado al obtener fichas clínicas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener las fichas clínicas', 
            error: error.message 
        });
    }
};

export const getReevaluaciones = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            tipo, 
            pagina = 1, 
            limite = 5, 
            fechaInicio, 
            fechaFin 
        } = req.query;

        // Validaciones
        if (!tipo || (tipo !== 'adulto' && tipo !== 'infantil')) {
            return res.status(400).json({
                success: false,
                message: 'Debe especificar un tipo válido (adulto o infantil)'
            });
        }

        // Construir condiciones de filtrado
        const whereConditions = {
            [Op.or]: [{ id }],
            is_reevaluacion: true
        };

        // Agregar filtro de fechas si están presentes
        if (fechaInicio && fechaFin) {
            whereConditions.fecha_evaluacion = {
                [Op.between]: [
                    new Date(fechaInicio), 
                    new Date(fechaFin)
                ]
            };
        } else if (fechaInicio) {
            whereConditions.fecha_evaluacion = {
                [Op.gte]: new Date(fechaInicio)
            };
        } else if (fechaFin) {
            whereConditions.fecha_evaluacion = {
                [Op.lte]: new Date(fechaFin)
            };
        }

        // Calcular offset para paginación
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        // Realizar consulta con paginación
        let resultado;

        if (tipo === 'adulto') {
            resultado = await FichaClinicaAdulto.findAndCountAll({
                where: whereConditions,
                include: [
                    {
                        model: PacienteAdulto,
                        attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad', 'telefono_principal', 'telefono_secundario']
                    },
                    {
                        model: Diagnostico,
                        as: 'diagnostico',
                        attributes: ['id', 'nombre'],
                    },
                    {
                        model: NivelEscolaridad,
                        as: 'NivelEscolaridad'
                    },
                    {
                        model: CicloVitalFamiliar,
                        as: 'cicloVitalFamiliarAdulto'
                    },
                    {
                        model: TipoFamilia,
                        through: FichaTipoFamilia,
                        as: 'tiposFamilia'
                    },
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'nombres', 'apellidos', 'correo']
                    },
                    {
                        model: Estudiante,
                        as: 'estudiante',
                        attributes: ['id', 'nombres', 'apellidos', 'correo']
                    },
                    {
                        model: Institucion,
                        as: 'institucion',
                        attributes: ['id', 'nombre']
                    }
                ],
                limit: parseInt(limite),
                offset: offset,
                order: [['fecha_evaluacion', 'DESC']]
            });

        } else {
            resultado = await FichaClinicaInfantil.findAndCountAll({
                where: whereConditions,
                include: [
                    {
                        model: PacienteInfantil,
                        attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad', 'telefono_principal', 'telefono_secundario']
                    },
                    {
                        model: FichaTipoFamilia,
                        as: 'fichasTipoFamiliaInfantiles',
                        include: [{
                            model: TipoFamilia,
                            as: 'tipoFamiliaInfantil',
                            attributes: ['id', 'nombre']
                        }]
                    },
                    {
                        model: CicloVitalFamiliar,
                        as: 'cicloVitalFamiliarInfantil'
                    },
                    {
                        model: FactorRiesgoNino,
                        through: {
                            model: FichaFactorRiesgoNino,
                            attributes: []
                        },
                        as: 'factoresRiesgoNino'
                    },
                    {
                        model: FactorRiesgoFamiliar,
                        through: {
                            model: FichaFactorRiesgoFamiliar,
                            attributes: ['otras']
                        },
                        as: 'factoresRiesgoFamiliar'
                    },
                    {
                        model: PadreTutor,
                        as: 'padresTutores',
                        include: [{
                            model: NivelEscolaridad,
                            as: 'nivelEscolaridad'
                        }]
                    },
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'nombres', 'apellidos', 'correo']
                    },
                    {
                        model: Estudiante,
                        as: 'estudiante',
                        attributes: ['id', 'nombres', 'apellidos', 'correo']
                    },
                    {
                        model: Institucion,
                        as: 'institucion',
                        attributes: ['id', 'nombre']
                    }
                ],
                limit: parseInt(limite),
                offset: offset,
                order: [['fecha_evaluacion', 'DESC']]
            });
        }

        // Formatear resultados
        const reevaluacionesFormateadas = resultado.rows.map(
            tipo === 'adulto' 
                ? formatearReevaluacionAdulto 
                : formatearReevaluacionInfantil
        );

        res.json({
            success: true,
            data: reevaluacionesFormateadas,
            totalPaginas: Math.ceil(resultado.count / parseInt(limite)),
            paginaActual: parseInt(pagina)
        });

    } catch (error) {
        console.error('Error al obtener reevaluaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las reevaluaciones',
            error: error.message
        });
    }
};
function formatearReevaluacionAdulto(reevaluacion) {
    return {
        id: reevaluacion.id,
        fecha: reevaluacion.fecha_evaluacion,
        is_reevaluacion: reevaluacion.is_reevaluacion,
        paciente: {
            id: reevaluacion.PacienteAdulto.id,
            nombres: reevaluacion.PacienteAdulto.nombres,
            apellidos: reevaluacion.PacienteAdulto.apellidos,
            rut: reevaluacion.PacienteAdulto.rut,
            edad: reevaluacion.PacienteAdulto.edad,
            telefonoPrincipal: reevaluacion.PacienteAdulto.telefono_principal,
            telefonoSecundario: reevaluacion.PacienteAdulto.telefono_secundario
        },
        diagnostico: {
            id: reevaluacion.diagnostico_id,
            nombre: reevaluacion.diagnostico && reevaluacion.diagnostico.nombre 
                ? reevaluacion.diagnostico.nombre 
                : reevaluacion.diagnostico_otro,
        },
        escolaridad: {
            id: reevaluacion.NivelEscolaridad?.id,
            nivel: reevaluacion.NivelEscolaridad?.nivel
        },
        ocupacion: reevaluacion.ocupacion,
        direccion: reevaluacion.direccion,
        conQuienVive: reevaluacion.con_quien_vive,
        horarioLlamada: reevaluacion.horario_llamada,
        conectividad: reevaluacion.conectividad,
        factoresRiesgo: {
            valorHbac1: reevaluacion.valor_hbac1,
            alcoholDrogas: reevaluacion.alcohol_drogas,
            tabaquismo: reevaluacion.tabaquismo,
            otros: reevaluacion.otros_factores
        },
        cicloVitalFamiliar: reevaluacion.cicloVitalFamiliarAdulto
            ? {
                id: reevaluacion.cicloVitalFamiliarAdulto.id,
                ciclo: reevaluacion.cicloVitalFamiliarAdulto.ciclo
            } 
            : null,
        tiposFamilia: reevaluacion.tiposFamilia.map(t => ({
            id: t.id,
            nombre: t.nombre
        })),
        estudiante: reevaluacion.estudiante ? {
            id: reevaluacion.estudiante.id,
            nombres: reevaluacion.estudiante.nombres,
            apellidos: reevaluacion.estudiante.apellidos,
            correo: reevaluacion.estudiante.correo
        } : null,
        usuario: reevaluacion.usuario ? {
            id: reevaluacion.usuario.id,
            nombres: reevaluacion.usuario.nombres,
            apellidos: reevaluacion.usuario.apellidos,
            correo: reevaluacion.usuario.correo
        } : null,
        institucion: reevaluacion.institucion ? {
            id: reevaluacion.institucion.id,
            nombre: reevaluacion.institucion.nombre
        } : null,
        createdAt: reevaluacion.createdAt,
        updatedAt: reevaluacion.updatedAt
    };
}

function formatearReevaluacionInfantil(reevaluacion) {
    return {
        id: reevaluacion.id,
        fecha: reevaluacion.fecha_evaluacion,
        is_reevaluacion: reevaluacion.is_reevaluacion,
        paciente: {
            id: reevaluacion.PacienteInfantil.id,
            nombres: reevaluacion.PacienteInfantil.nombres,
            apellidos: reevaluacion.PacienteInfantil.apellidos,
            rut: reevaluacion.PacienteInfantil.rut,
            edad: reevaluacion.PacienteInfantil.edad,
            telefonoPrincipal: reevaluacion.PacienteInfantil.telefono_principal,
            telefonoSecundario: reevaluacion.PacienteInfantil.telefono_secundario
        },
        evaluacionPsicomotora: {
            puntajeDPM: reevaluacion.puntaje_dpm,
            diagnosticoDSM: reevaluacion.diagnostico_dsm
        },
        informacionFamiliar: {
            conQuienVive: reevaluacion.con_quien_vive,
            tiposFamilia: (reevaluacion.fichasTipoFamiliaInfantiles || []).map(t => ({
                id: t.id || null,
                nombre: t.tipoFamiliaInfantil?.nombre || (t.tipo_familia_otro ? t.tipo_familia_otro : 'No especificado')
            })),
            cicloVitalFamiliar: reevaluacion.cicloVitalFamiliarInfantil 
                ? {
                    id: reevaluacion.cicloVitalFamiliarInfantil.id,
                    ciclo: reevaluacion.cicloVitalFamiliarInfantil.ciclo
                } 
                : null,
            localidad: reevaluacion.localidad,
            padres: reevaluacion.padresTutores.map(padre => ({
                id: padre.id,
                nombre: padre.nombre,
                escolaridad: {
                    id: padre.nivelEscolaridad?.id,
                    nivel: padre.nivelEscolaridad?.nivel 
                },
                ocupacion: padre.ocupacion
            }))
        },
        factoresRiesgo: {
            nino: reevaluacion.factoresRiesgoNino.map(factor => ({
                id: factor.id,
                nombre: factor.nombre
            })),
            familiares: reevaluacion.factoresRiesgoFamiliar.map(factor => ({
                id: factor.id || null,
                nombre: factor.nombre || null,
                otras: factor.FichaFactorRiesgoFamiliar?.otras || null
            }))
        },
        estudiante: reevaluacion.estudiante ? {
            id: reevaluacion.estudiante.id,
            nombres: reevaluacion.estudiante.nombres,
            apellidos: reevaluacion.estudiante.apellidos,
            email: reevaluacion.estudiante.email
        } : null,
        usuario: reevaluacion.usuario ? {
            id: reevaluacion.usuario.id,
            nombres: reevaluacion.usuario.nombres,
            apellidos: reevaluacion.usuario.apellidos,
            correo: reevaluacion.usuario.correo
        } : null,
        institucion: reevaluacion.institucion ? {
            id: reevaluacion.institucion.id,
            nombre: reevaluacion.institucion.nombre
        } : null,
        createdAt: reevaluacion.createdAt,
        updatedAt: reevaluacion.updatedAt
    };
};