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
import sequelize from '../models/index.js';
import { Op, Sequelize } from 'sequelize';

export const getFichasClinicasPorInstitucion = async (req, res) => {
    try {
        const { institucionId } = req.params;
        const { rol_id, estudiante_id } = req.user;
        
        // Parámetros de paginación y búsqueda
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;
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


        // Obtener fichas de adultos con paginación y búsqueda
        const fichasAdultos = await FichaClinicaAdulto.findAndCountAll({
            where: whereAdultos,
            include: [
                {
                    model: PacienteAdulto,
                    attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad']
                },
                {
                    model: NivelEscolaridad,
                    attributes: ['nivel']
                },
                {
                    model: CicloVitalFamiliar,
                    through: FichaCicloVital,
                    as: 'ciclosVitalesFamiliares'
                },
                {
                    model: TipoFamilia,
                    through: FichaTipoFamilia,
                    as: 'tiposFamilia'
                },
                {
                    model: Diagnostico,
                    attributes: ['id', 'nombre'],
                    as: 'diagnostico'
                },
            ],
            order: [['fecha_evaluacion', 'DESC']],
            limit,
            offset
        });

        // Obtener fichas infantiles con paginación y búsqueda
        const fichasInfantiles = await FichaClinicaInfantil.findAndCountAll({
            where: whereInfantiles,
            include: [
                {
                    model: PacienteInfantil,
                    attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad']
                },
                {
                    model: CicloVitalFamiliar,
                    through: FichaCicloVital,
                    as: 'ciclosVitalesFamiliaresInfantil',
                    attributes: ['ciclo']
                },
                {
                    model: TipoFamilia,
                    through: FichaTipoFamilia,
                    as: 'tiposFamiliaInfantil',
                    attributes: ['nombre']
                },
                {
                    model: FactorRiesgoNino,
                    through: FichaFactorRiesgoNino,
                    as: 'factoresRiesgoNinoInfantil'
                },
                {
                    model: FactorRiesgoFamiliar,
                    through: FichaFactorRiesgoFamiliar,
                    as: 'factoresRiesgoFamiliarInfantil'
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
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        
        // Formatear fichas de adultos
        const fichasAdultosFormateadas = fichasAdultos.rows.map(ficha => ({
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
            escolaridad: ficha.NivelEscolaridad?.nivel,
            ocupacion: ficha.ocupacion,
            factoresRiesgo: {
                valorHbac1: ficha.valor_hbac1,
                alcoholDrogas: ficha.alcohol_drogas,
                tabaquismo: ficha.tabaquismo
            },
            ciclosVitalesFamiliares: ficha.ciclosVitalesFamiliares.map(c => c.ciclo),
            tiposFamilia: ficha.tiposFamilia.map(t => t.nombre),
            createdAt: ficha.createdAt,
            updatedAt: ficha.updatedAt
        }));

        // Formatear fichas infantiles
        const fichasInfantilesFormateadas = fichasInfantiles.rows.map(ficha => ({
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
            puntajeDPM: ficha.puntaje_dpm,
            conQuienVive: ficha.con_quien_vive,
            tiposFamilia: ficha.tiposFamiliaInfantil.map(t => t.nombre),
            ciclosVitalesFamiliares: ficha.ciclosVitalesFamiliaresInfantil.map(c => c.ciclo),
            factoresRiesgoNino: ficha.factoresRiesgoNinoInfantil.map(f => f.nombre),
            factoresRiesgoFamiliar: ficha.factoresRiesgoFamiliarInfantil.map(f => f.nombre),
            createdAt: ficha.createdAt,
            updatedAt: ficha.updatedAt
        }));

        // Combinar y ordenar todas las fichas por fecha
        const todasLasFichas = [...fichasAdultosFormateadas, ...fichasInfantilesFormateadas]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, limit);

        // Calcular el total de registros
        const totalAdultos = fichasAdultos.count;
        const totalInfantiles = fichasInfantiles.count;
        const totalRegistros = totalAdultos + totalInfantiles;

        // Calcular información de paginación
        const totalPaginas = Math.ceil(totalRegistros / limit);
        const paginaActual = page;
        const siguientePagina = paginaActual < totalPaginas ? paginaActual + 1 : null;
        const paginaAnterior = paginaActual > 1 ? paginaActual - 1 : null;

        res.json({
            success: true,
            data: todasLasFichas,
            pagination: {
                totalRegistros,
                totalPaginas,
                paginaActual,
                siguientePagina,
                paginaAnterior,
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
            ciclosVitalesFamiliares,
            telefonoPrincipal,
            telefonoSecundario,
            horarioLlamada,
            conectividad,
            valorHbac1,
            factoresRiesgo,
            estudiante_id,
            usuario_id,
            institucion_id
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
            horario_llamada: horarioLlamada,
            conectividad,
            valor_hbac1: parseFloat(valorHbac1),
            alcohol_drogas: factoresRiesgo.alcoholDrogas,
            tabaquismo: factoresRiesgo.tabaquismo,
            otros_factores: factoresRiesgo.otros,
            estudiante_id: estudiante_id || null,
            usuario_id: usuario_id || null,
            institucion_id
        }, { transaction: t });

        // Asociar ciclos vitales familiares
        if (ciclosVitalesFamiliares && ciclosVitalesFamiliares.length > 0) {
            const ciclosVitales = await CicloVitalFamiliar.findAll({
                where: {
                    id: ciclosVitalesFamiliares
                },
                transaction: t
            });
            
            await Promise.all(ciclosVitales.map(ciclo => 
                FichaCicloVital.create({
                    ficha_clinica_id: fichaClinica.id,
                    ciclo_vital_familiar_id: ciclo.id,
                    tipo_ficha: 'adulto'
                }, { transaction: t })
            ));
        }

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
                paciente
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
        tipo_familia_id: tipoFamilia,
        ciclo_vital_familiar_id: cicloVitalFamiliar,
        localidad,
        estudiante_id,
        usuario_id,
        institucion_id
      }, { transaction: t });
  
      // Guardar factores de riesgo del niño
    if (factoresRiesgoNino && factoresRiesgoNino.length > 0) {
        const factoresNino = await FactorRiesgoNino.findAll({
          where: { nombre: factoresRiesgoNino },
          transaction: t
        });
        await fichaClinica.setFactoresRiesgoNinoInfantil(factoresNino, { transaction: t });
      }
  
    // Guardar factores de riesgo familiares
    if (factoresRiesgoFamiliares.seleccionados) {
        for (const [factorId, isSelected] of Object.entries(factoresRiesgoFamiliares.seleccionados)) {
        if (isSelected) {
            const factor = await FactorRiesgoFamiliar.findByPk(factorId);
            if (factor) {
            await FichaFactorRiesgoFamiliar.create({
                ficha_clinica_id: fichaClinica.id,
                factor_riesgo_familiar_id: factorId,
                otras: factor.nombre === 'Otras' ? factoresRiesgoFamiliares.otrasTexto : null
            }, { transaction: t });
            }
        }
        }
    }

    // Guardar otros factores de riesgo familiares si existen
    if (otrosFactoresRiesgoFamiliares) {
    const otroFactor = await FactorRiesgoFamiliar.findOne({
        where: { nombre: 'Otras' },
        transaction: t
    });
    if (otroFactor) {
        await FichaFactorRiesgoFamiliar.create({
        ficha_clinica_id: fichaClinica.id,
        factor_riesgo_familiar_id: otroFactor.id,
        descripcion: otrosFactoresRiesgoFamiliares
        }, { transaction: t });
    }
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
        paciente
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
                    through: FichaCicloVital,
                    as: 'ciclosVitalesFamiliaresInfantil'
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
                }
            ]
        });

        if (!fichaClinica) {
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica infantil no encontrada'
            });
        }

        const fichaFormateada = formatearFichaInfantil(fichaClinica);

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
                        model: CicloVitalFamiliar,
                        through: FichaCicloVital,
                        as: 'ciclosVitalesFamiliares'
                    },
                    {
                        model: TipoFamilia,
                        through: FichaTipoFamilia,
                        as: 'tiposFamilia'
                    },
                    {
                        model: NivelEscolaridad,
                        as: 'NivelEscolaridad'
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
                        through: FichaCicloVital,
                        as: 'ciclosVitalesFamiliaresInfantil'
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
        diagnostico: fichaClinica.diagnostico,
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
            tabaquismo: fichaClinica.tabaquismo
        },
        ciclosVitalesFamiliares: fichaClinica.ciclosVitalesFamiliares.map(c => ({
            id: c.id,
            ciclo: c.ciclo
        })),
        tiposFamilia: fichaClinica.tiposFamilia.map(t => ({
            id: t.id,
            nombre: t.nombre
        })),
        estudiante_id: fichaClinica.estudiante_id,
        usuario_id: fichaClinica.usuario_id,
        institucion_id: fichaClinica.institucion_id,
        createdAt: fichaClinica.createdAt,
        updatedAt: fichaClinica.updatedAt
    };
}

function formatearFichaInfantil(fichaClinica) {
    return {
        id: fichaClinica.id,
        paciente: {
            id: fichaClinica.PacienteInfantil.id,
            nombres: fichaClinica.PacienteInfantil.nombres,
            apellidos: fichaClinica.PacienteInfantil.apellidos,
            rut: fichaClinica.PacienteInfantil.rut,
            edad: fichaClinica.PacienteInfantil.edad,
            telefonoPrincipal: fichaClinica.PacienteInfantil.telefono_principal,
            telefonoSecundario: fichaClinica.PacienteInfantil.telefono_secundario
        },
        evaluacionPsicomotora: {
            puntajeDPM: fichaClinica.puntaje_dpm,
            diagnosticoDSM: fichaClinica.diagnostico_dsm
        },
        informacionFamiliar: {
            conQuienVive: fichaClinica.con_quien_vive,
            tipoFamilia: fichaClinica.tiposFamiliaInfantil.length > 0 
                ? {
                    id: fichaClinica.tiposFamiliaInfantil[0].id,
                    nombre: fichaClinica.tiposFamiliaInfantil[0].nombre
                } 
                : {},
            cicloVitalFamiliar: fichaClinica.ciclosVitalesFamiliaresInfantil.length > 0 
                ? {
                    id: fichaClinica.ciclosVitalesFamiliaresInfantil[0].id,
                    ciclo: fichaClinica.ciclosVitalesFamiliaresInfantil[0].ciclo
                } 
                : {},
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
                id: factor.id,
                nombre: factor.nombre,
                otras: factor.FichaFactorRiesgoFamiliar?.otras 
                    ? factor.FichaFactorRiesgoFamiliar.otras 
                    : null
            }))
        },
        estudiante_id: fichaClinica.estudiante_id,
        usuario_id: fichaClinica.usuario_id,
        institucion_id: fichaClinica.institucion_id,
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
            limite = 10 
        } = req.query;

        // Condiciones base
        const whereConditions = {};
        const pacienteWhereConditions = {};
        const includeConditions = [];

        // Manejo de tipos de ficha
        let modelos = [];
        if (!tipoFicha || tipoFicha === '') {
            // Si no hay filtro, buscar en ambos modelos
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

        // Configurar paginación
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

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
                    limit: parseInt(limite),
                    offset: offset,
                    distinct: true
                });
            })
        );

        // Combinar resultados
        const fichas = resultados.flatMap(resultado => resultado.rows);
        const total = resultados.reduce((sum, resultado) => sum + resultado.count, 0);

        res.json({
            success: true,
            total: total,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            fichas: fichas
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