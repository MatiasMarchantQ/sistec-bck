import PacienteAdulto from '../models/PacienteAdulto.js';
import FichaClinicaAdulto from '../models/FichaClinicaAdulto.js';
import PacienteInfantil from '../models/PacienteInfantil.js';
import FichaClinicaInfantil from '../models/FichaClinicaInfantil.js';
import NivelEscolaridad from '../models/NivelEscolaridad.js';
import CicloVitalFamiliar from '../models/CicloVitalFamiliar.js';
import TipoFamilia from '../models/TipoFamilia.js';
import FichaTipoFamilia from '../models/FichaTipoFamilia.js';
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
import DiagnosticoFichaAdulto from '../models/DiagnosticoFichaAdulto.js';
import ExcelJS from 'exceljs';

export const getFichasClinicasPorInstitucion = async (req, res) => {
    try {
        const { institucionId } = req.params;
        const { rol_id, estudiante_id } = req.user;

        // Parámetros de búsqueda y paginación
        const busqueda = req.query.search ? req.query.search.trim() : '';
        const page = Math.max(1, parseInt(req.query.page)) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Parámetros adicionales del segundo controlador
        const {
            fechaInicio,
            fechaFin,
            isReevaluacion
        } = req.query;

        let whereClause = { institucion_id: institucionId };

        // if (rol_id === 3) {
        //     whereClause.estudiante_id = estudiante_id;
        // }

        // Construcción de whereClause con condiciones adicionales
        if (fechaInicio && fechaFin) {
            whereClause.fecha = {
                [Op.between]: [fechaInicio, fechaFin]
            };
        } else if (fechaInicio) {
            whereClause.fecha = {
                [Op.gte]: fechaInicio
            };
        } else if (fechaFin) {
            whereClause.fecha = {
                [Op.lte]: fechaFin
            };
        }

        if (isReevaluacion !== undefined && isReevaluacion !== '') {
            whereClause.is_reevaluacion = isReevaluacion === 'true';
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
                    model: DiagnosticoFichaAdulto,
                    as: 'DiagnosticoFichas',
                    include: [{
                        model: Diagnostico,
                        as: 'Diagnostico',
                        attributes: ['id', 'nombre']
                    }]
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

        // Agrupar fichas de adultos por paciente_id
        const fichasAdultosPorPaciente = {};
        const reevaluacionesAdultosPorPaciente = {};

        fichasAdultos.forEach(ficha => {
            const pacienteId = ficha.PacienteAdulto.id;

            // Contar reevaluaciones
            if (ficha.is_reevaluacion) {
                if (!reevaluacionesAdultosPorPaciente[pacienteId]) {
                    reevaluacionesAdultosPorPaciente[pacienteId] = 1;
                } else {
                    reevaluacionesAdultosPorPaciente[pacienteId]++;
                }
            }

            if (!fichasAdultosPorPaciente[pacienteId] ||
                new Date(ficha.createdAt) > new Date(fichasAdultosPorPaciente[pacienteId].createdAt)) {
                fichasAdultosPorPaciente[pacienteId] = ficha;
            }
        });

        // Agrupar fichas infantiles por paciente_id
        const fichasInfantilesPorPaciente = {};
        const reevaluacionesInfantilesPorPaciente = {};

        fichasInfantiles.forEach(ficha => {
            const pacienteId = ficha.PacienteInfantil.id;

            // Contar reevaluaciones
            if (ficha.is_reevaluacion) {
                if (!reevaluacionesInfantilesPorPaciente[pacienteId]) {
                    reevaluacionesInfantilesPorPaciente[pacienteId] = 1;
                } else {
                    reevaluacionesInfantilesPorPaciente[pacienteId]++;
                }
            }

            if (!fichasInfantilesPorPaciente[pacienteId] ||
                new Date(ficha.createdAt) > new Date(fichasInfantilesPorPaciente[pacienteId].createdAt)) {
                fichasInfantilesPorPaciente[pacienteId] = ficha;
            }
        });

        // Formatear fichas de adultos agrupadas
        const fichasAdultosFormateadas = Object.values(fichasAdultosPorPaciente).map(ficha => ({
            id: ficha.id,
            tipo: 'adulto',
            fecha: ficha.fecha_evaluacion,
            paciente: {
                id: ficha.PacienteAdulto.id,
                nombres: ficha.PacienteAdulto.nombres,
                apellidos: ficha.PacienteAdulto.apellidos,
                rut: ficha.PacienteAdulto.rut,
                edad: ficha.PacienteAdulto.edad
            },
            diagnosticos: ficha.DiagnosticoFichas.map(diagnostico => ({
                id: diagnostico.Diagnostico ? diagnostico.Diagnostico.id : null,
                nombre: diagnostico.es_diagnostico_otro
                    ? diagnostico.diagnostico_otro_texto
                    : (diagnostico.Diagnostico ? diagnostico.Diagnostico.nombre : 'Sin diagnóstico'),
                esOtro: diagnostico.es_diagnostico_otro
            })),
            reevaluaciones: reevaluacionesAdultosPorPaciente[ficha.PacienteAdulto.id] || 0,
            createdAt: ficha.createdAt,
            updatedAt: ficha.updatedAt
        }));

        // Formatear fichas infantiles agrupadas
        const fichasInfantilesFormateadas = Object.values(fichasInfantilesPorPaciente).map(ficha => ({
            id: ficha.id,
            tipo: 'infantil',
            fecha: ficha.createdAt,
            paciente: {
                id: ficha.PacienteInfantil.id,
                nombres: ficha.PacienteInfantil.nombres,
                apellidos: ficha.PacienteInfantil.apellidos,
                rut: ficha.PacienteInfantil.rut,
                edad: ficha.PacienteInfantil.edad
            },
            diagnostico: {
                id: null,
                nombre: ficha.diagnostico_dsm || 'Sin diagnóstico'
            },
            reevaluaciones: reevaluacionesInfantilesPorPaciente[ficha.PacienteInfantil.id] || 0,
            createdAt: ficha.createdAt,
            updatedAt: ficha.updatedAt
        }));

        // Combinar todas las fichas
        const todasLasFichas = [...fichasAdultosFormateadas, ...fichasInfantilesFormateadas];

        // Ordenar las fichas combinadas por createdAt
        todasLasFichas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Calcular el total de registros
        const totalRegistros = todasLasFichas.length;

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
            diagnosticos_id,
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

        if (!diagnosticos_id || (diagnosticos_id.length === 0 && !diagnostico_otro)) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un diagnóstico (predefinido o personalizado)'
            });
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
            diagnostico_otro: null,
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

        // Manejar diagnósticos
        if (diagnosticos_id && diagnosticos_id.length > 0) {
            const diagnosticosPromesas = diagnosticos_id.map(async (diagnosticoId) => {
                await DiagnosticoFichaAdulto.create({
                    ficha_clinica_id: fichaClinica.id,
                    diagnostico_id: diagnosticoId,
                    es_diagnostico_otro: false
                }, { transaction: t });
            });
            await Promise.all(diagnosticosPromesas);
        }

        // Manejar diagnóstico personalizado
        if (diagnostico_otro) {
            await DiagnosticoFichaAdulto.create({
                ficha_clinica_id: fichaClinica.id,
                diagnostico_id: null, // Asegúrate de que el ID sea nulo
                es_diagnostico_otro: true,
                diagnostico_otro_texto: diagnostico_otro
            }, { transaction: t });
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
            data: fichaClinica
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
            institucion_id,
            isReevaluacion = 0
        } = req.body;

        // Verificar existencia de paciente con el mismo RUT
        const pacienteExistente = await PacienteInfantil.findOne({
            where: { rut },
            transaction: t
        });

        // Cuando NO es reevaluación (primera vez)
        if (!isReevaluacion) {
            // Si ya existe un paciente con este RUT
            if (pacienteExistente) {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un paciente registrado con este RUT',
                    error: 'RUT duplicado'
                });
            }
        }

        // Cuando es reevaluación
        if (isReevaluacion) {
            // Verificar que el paciente exista para poder hacer reevaluación
            if (!pacienteExistente) {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'No se puede crear una reevaluación para un paciente que no existe',
                    error: 'Paciente no encontrado'
                });
            }
        }

        // Crear paciente SOLO si no existe (cuando no es reevaluación)
        let paciente;
        if (!pacienteExistente) {
            paciente = await PacienteInfantil.create({
                nombres,
                apellidos,
                rut,
                fecha_nacimiento: fechaNacimiento,
                edad,
                telefono_principal: telefonoPrincipal,
                telefono_secundario: telefonoSecundario
            }, { transaction: t });
        } else {
            // Si es reevaluación, usar el paciente existente
            paciente = pacienteExistente;
        }

        // Verificar si ya existe una ficha inicial para este paciente
        if (!isReevaluacion) {
            const fichaExistente = await FichaClinicaInfantil.findOne({
                where: {
                    paciente_id: paciente.id,
                    is_reevaluacion: 0
                },
                transaction: t
            });

            if (fichaExistente) {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una ficha clínica inicial para este paciente',
                    error: 'Ficha duplicada'
                });
            }
        }



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
            institucion_id,
            is_reevaluacion: isReevaluacion
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
                    attributes: ['id', 'nombres', 'apellidos', 'correo']
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

export const getFichaClinica = async (req, res) => {
    try {
        const { id } = req.params; // Este id es el de la ficha clínica solicitada
        const { tipo } = req.query;

        if (!tipo || (tipo !== 'adulto' && tipo !== 'infantil')) {
            return res.status(400).json({
                success: false,
                message: 'Debe especificar un tipo válido (adulto o infantil)'
            });
        }

        let fichaClinica;
        let fichaFormateada;

        // Primero, obtenemos la ficha clínica para obtener el paciente_id
        let fichaSolicitada;
        if (tipo === 'adulto') {
            fichaSolicitada = await FichaClinicaAdulto.findByPk(id);
        } else {
            fichaSolicitada = await FichaClinicaInfantil.findByPk(id);
        }

        // Validar si la ficha solicitada existe
        if (!fichaSolicitada) {
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica no encontrada'
            });
        }

        const paciente_id = fichaSolicitada.paciente_id; // Obtener el paciente_id de la ficha solicitada

        // Ahora buscar la ficha clínica original (is_reevaluacion === 0)
        if (tipo === 'adulto') {
            fichaClinica = await FichaClinicaAdulto.findOne({
                where: {
                    paciente_id,
                    is_reevaluacion: 0 // Solo buscar fichas originales
                },
                include: [
                    {
                        model: PacienteAdulto,
                        attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad', 'telefono_principal', 'telefono_secundario']
                    },
                    {
                        model: DiagnosticoFichaAdulto,
                        as: 'DiagnosticoFichas',
                        include: [{
                            model: Diagnostico,
                            as: 'Diagnostico',
                            attributes: ['id', 'nombre']
                        }]
                    },
                    {
                        model: CicloVitalFamiliar,
                        as: 'cicloVitalFamiliarAdulto',
                        attributes: ['id', 'ciclo']
                    },
                    {
                        model: FichaTipoFamilia,
                        as: 'fichaTipoFamilia',
                        where: { tipo_ficha: 'adulto' },
                        required: false,
                        include: [{
                            model: TipoFamilia,
                            as: 'tipoFamiliaAdulto',
                            attributes: ['id', 'nombre']
                        }]
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
                        attributes: ['id', 'nombres', 'apellidos', 'correo']
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
            fichaClinica = await FichaClinicaInfantil.findOne({
                where: {
                    paciente_id,
                    is_reevaluacion: 0 // Solo buscar fichas originales
                },
                include: [
                    {
                        model: PacienteInfantil,
                        attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad', 'telefono_principal', 'telefono_secundario', 'fecha_nacimiento']
                    },
                    {
                        model: CicloVitalFamiliar,
                        as: 'cicloVitalFamiliarInfantil',
                        attributes: ['id', 'ciclo']
                    },
                    {
                        model: FichaTipoFamilia,
                        as: 'fichasTipoFamiliaInfantiles',
                        where: { tipo_ficha: 'infantil' },
                        required: false,
                        include: [{
                            model: TipoFamilia,
                            as: 'tipoFamiliaInfantil',
                            attributes: ['id', 'nombre']
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
                        attributes: ['id', 'nombres', 'apellidos', 'correo']
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
                message: 'Ficha clínica original no encontrada'
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
    const tiposFamiliaFormateados = fichaClinica.fichaTipoFamilia && fichaClinica.fichaTipoFamilia.length > 0
        ? fichaClinica.fichaTipoFamilia.map(fichaTipo => ({
            id: fichaTipo.tipo_familia_id,
            nombre: fichaTipo.nombre
                ? null
                : (fichaTipo.tipoFamiliaAdulto
                    ? fichaTipo.tipoFamiliaAdulto.nombre
                    : null),
            tipoFamiliaOtro: fichaTipo.tipo_familia_otro || null
        }))
        : [{
            id: null,
            nombre: null,
            tipoFamiliaOtro: null
        }];

    const diagnosticos = fichaClinica.DiagnosticoFichas && fichaClinica.DiagnosticoFichas.length > 0
        ? fichaClinica.DiagnosticoFichas.map(diagnosticoFicha => ({
            id: diagnosticoFicha.es_diagnostico_otro
                ? null
                : diagnosticoFicha.diagnostico_id,
            nombre: diagnosticoFicha.es_diagnostico_otro
                ? diagnosticoFicha.diagnostico_otro_texto
                : diagnosticoFicha.Diagnostico.nombre,
            esOtro: diagnosticoFicha.es_diagnostico_otro
        })) : [];

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
        diagnosticos,
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

        tiposFamilia: tiposFamiliaFormateados,

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
    // Formatear tipos de familia
    const tiposFamiliaFormateados = fichaClinica.fichasTipoFamiliaInfantiles && fichaClinica.fichasTipoFamiliaInfantiles.length > 0
        ? fichaClinica.fichasTipoFamiliaInfantiles.map(fichaTipo => {
            return {
                id: fichaTipo.tipo_familia_id || (fichaTipo.tipoFamiliaInfantil ? fichaTipo.tipoFamiliaInfantil.id : null),
                nombre: fichaTipo.tipo_familia_otro
                    ? null
                    : (fichaTipo.tipoFamiliaInfantil
                        ? fichaTipo.tipoFamiliaInfantil.nombre
                        : null),
                tipoFamiliaOtro: fichaTipo.tipo_familia_otro || null
            };
        })
        : [{
            id: null,
            nombre: null,
            tipoFamiliaOtro: null
        }];
    // Verificaciones de existencia de objetos
    const paciente = fichaClinica.PacienteInfantil || {};
    const cicloVitalFamiliar = fichaClinica.cicloVitalFamiliarInfantil || {};
    const estudiante = fichaClinica.estudiante || {};
    const usuario = fichaClinica.usuario || {};
    const institucion = fichaClinica.institucion || {};

    return {
        id: fichaClinica.id || null,
        fecha: fichaClinica.createdAt || null,
        paciente: {
            id: paciente.id || null,
            nombres: paciente.nombres || 'N/A',
            apellidos: paciente.apellidos || 'N/A',
            rut: paciente.rut || 'N/A',
            fechaNacimiento: paciente.fecha_nacimiento || null,
            edad: paciente.edad || 'N/A',
            telefonoPrincipal: paciente.telefono_principal || 'N/A',
            telefonoSecundario: paciente.telefono_secundario || 'N/A'
        },
        evaluacionPsicomotora: {
            puntajeDPM: fichaClinica.puntaje_dpm || null,
            diagnosticoDSM: fichaClinica.diagnostico_dsm || null
        },
        informacionFamiliar: {
            conQuienVive: fichaClinica.con_quien_vive || 'N/A',
            tiposFamilia: tiposFamiliaFormateados,
            cicloVitalFamiliar: cicloVitalFamiliar
                ? {
                    id: cicloVitalFamiliar.id || null,
                    ciclo: cicloVitalFamiliar.ciclo || null
                }
                : null,
            localidad: fichaClinica.localidad || 'N/A',
            padres: (fichaClinica.padresTutores || []).map(padre => ({
                id: padre.id || null,
                nombre: padre.nombre || 'N/A',
                escolaridad: {
                    id: padre.nivelEscolaridad?.id || null,
                    nivel: padre.nivelEscolaridad?.nivel || 'N/A'
                },
                ocupacion: padre.ocupacion || 'N/A'
            }))
        },
        factoresRiesgo: {
            nino: (fichaClinica.factoresRiesgoNino || []).map(factor => ({
                id: factor.id || null,
                nombre: factor.nombre || 'N/A'
            })),
            familiares: (fichaClinica.factoresRiesgoFamiliar || []).map(factor => ({
                id: factor.id || null,
                nombre: factor.nombre || null,
                otras: factor.FichaFactorRiesgoFamiliar?.otras || null
            }))
        },
        estudiante: estudiante ? {
            id: estudiante.id || null,
            nombres: estudiante.nombres || '',
            apellidos: estudiante.apellidos || '',
            email: estudiante.correo || ''
        } : null,
        usuario: usuario ? {
            id: usuario.id || null,
            nombres: usuario.nombres || '',
            apellidos: usuario.apellidos || '',
            correo: usuario.correo || ''
        } : null,
        institucion: institucion ? {
            id: institucion.id || null,
            nombre: institucion.nombre || ''
        } : null,
        createdAt: fichaClinica.createdAt || null,
        updatedAt: fichaClinica.updatedAt || null
    };
}

export const obtenerFichasClinicas = async (req, res) => {
    try {
        const {
            tipoInstitucion,
            institucion,
            textoBusqueda,
            tipoFicha,
            fechaInicial,
            fechaFinal,
            pagina = 1,
            limite = 10
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

        if (institucion) {
            whereConditions.institucion_id = parseInt(institucion);
        }

        // Agregar condiciones de fecha
        if (fechaInicial || fechaFinal) {
            const condicionesFecha = {};

            if (fechaInicial) {
                condicionesFecha[Op.gte] = new Date(fechaInicial);
            }

            if (fechaFinal) {
                condicionesFecha[Op.lte] = new Date(fechaFinal);
            }

            whereConditions.createdAt = condicionesFecha;
        }

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

        const resultados = await Promise.all(
            modelos.map(async ({ modelo, pacienteModelo }) => {
                const includeConfig = [
                    {
                        model: pacienteModelo,
                        where: textConditions,
                        required: true
                    },
                    {
                        model: Institucion,
                        include: [{
                            model: TipoInstitucion,
                            required: false
                        }],
                        where: tipoInstitucion ? { tipo_id: parseInt(tipoInstitucion) } : {},
                        required: true
                    }
                ];

                if (modelo === FichaClinicaAdulto) {
                    includeConfig.push({
                        model: DiagnosticoFichaAdulto,
                        as: 'DiagnosticoFichas',
                        include: [{
                            model: Diagnostico,
                            as: 'Diagnostico',
                            attributes: ['id', 'nombre'],
                            required: false
                        }],
                        required: false
                    });
                }

                const fichas = await modelo.findAll({
                    where: whereConditions,
                    include: includeConfig,
                    order: [['createdAt', 'DESC']]
                });

                const fichasPorPaciente = {};
                const reevaluacionesPorPaciente = {};

                fichas.forEach(ficha => {
                    const pacienteId = ficha.paciente_id;

                    if (ficha.is_reevaluacion) {
                        reevaluacionesPorPaciente[pacienteId] =
                            (reevaluacionesPorPaciente[pacienteId] || 0) + 1;
                    }

                    if (!fichasPorPaciente[pacienteId] ||
                        new Date(ficha.createdAt) > new Date(fichasPorPaciente[pacienteId].createdAt)) {
                        fichasPorPaciente[pacienteId] = ficha;
                    }
                });

                return Object.values(fichasPorPaciente).map(ficha => {
                    const fichaFormateada = {
                        ...ficha.get({ plain: true }),
                        reevaluaciones: reevaluacionesPorPaciente[ficha.paciente_id] || 0
                    };

                    if (modelo === FichaClinicaAdulto && ficha.DiagnosticoFichas) {
                        fichaFormateada.diagnosticos = (ficha.DiagnosticoFichas || []).map(diagnosticoFicha => ({
                            id: diagnosticoFicha.es_diagnostico_otro ? null : diagnosticoFicha.diagnostico_id,
                            nombre: diagnosticoFicha.es_diagnostico_otro
                                ? diagnosticoFicha.diagnostico_otro_texto
                                : (diagnosticoFicha.Diagnostico?.nombre || 'No especificado'),
                            esOtro: diagnosticoFicha.es_diagnostico_otro
                        }));
                    }

                    return fichaFormateada;
                });
            })
        );

        const fichasCombinadas = resultados.flat().sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        const offset = (parseInt(pagina) - 1) * parseInt(limite);
        const fichasPaginadas = fichasCombinadas.slice(offset, offset + parseInt(limite));

        res.json({
            success: true,
            total: fichasCombinadas.length,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            fichas: fichasPaginadas
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

export const exportarFichasClinicas = async (req, res) => {
    try {
        const {
            tipoInstitucion,
            institucion,
            textoBusqueda,
            tipoFicha,
            fechaInicial,
            fechaFinal,
            pagina = 1,
            limite = 10000  // Establecer un límite alto para obtener todos los registros
        } = req.query;

        // Si no se especifica tipo de ficha, exportar ambos
        const tipoFichaFinal = tipoFicha || '';

        // Aquí puedes reutilizar la lógica de obtenerFichasClinicas
        const params = {
            tipoInstitucion,
            institucion,
            textoBusqueda,
            tipoFicha: tipoFichaFinal,
            fechaInicial,
            fechaFinal,
            pagina,
            limite
        };

        // Simular la llamada a obtenerFichasClinicas
        const fichas = await new Promise((resolve, reject) => {
            const mockRes = {
                json: (data) => resolve(data),
                status: (code) => ({
                    json: (errorData) => reject(new Error(errorData.message))
                })
            };

            obtenerFichasClinicas({ query: params }, mockRes);
        });

        // Transformar los datos para exportación
        const datosExportacion = await Promise.all(fichas.fichas.map(async ficha => {
            const esInfantil = ficha.PacienteInfantil !== undefined;
            const paciente = esInfantil ? ficha.PacienteInfantil : ficha.PacienteAdulto;

            // Obtener la primera ficha clínica (is_reevaluacion = 0)
            const primeraFicha = await (esInfantil ? FichaClinicaInfantil : FichaClinicaAdulto).findOne({
                where: {
                    paciente_id: paciente.id,
                    is_reevaluacion: 0
                },
                order: [['createdAt', 'ASC']]
            });

            // Obtener la última ficha clínica (is_reevaluacion = 1)
            const ultimaFicha = await (esInfantil ? FichaClinicaInfantil : FichaClinicaAdulto).findOne({
                where: {
                    paciente_id: paciente.id,
                    is_reevaluacion: 1
                },
                order: [['createdAt', 'DESC']]
            });

            const resultado = {
                tipo: esInfantil ? 'Infantil' : 'Adulto',
                rut: paciente.rut,
                nombres: paciente.nombres,
                apellidos: paciente.apellidos,
                institucion: ficha.Institucion.nombre,
                tipoInstitucion: ficha.Institucion.TipoInstitucion?.nombre || 'No especificado',
                fechaInicial: primeraFicha ? new Date(primeraFicha.createdAt).toLocaleDateString() : 'No registrada',
                fechaFinal: ultimaFicha ? new Date(ultimaFicha.createdAt).toLocaleDateString() : 'No registrada',
                reevaluaciones: ficha.reevaluaciones
            };

            if (esInfantil) {
                resultado.diagnosticoDSMInicial = primeraFicha ? primeraFicha.diagnostico_dsm : 'No registrado';
                resultado.diagnosticoDSMFinal = ultimaFicha ? ultimaFicha.diagnostico_dsm : 'No registrado';

                // Comparar diagnósticos
                resultado.estadoDiagnostico = compararDiagnosticos(resultado.diagnosticoDSMInicial, resultado.diagnosticoDSMFinal);
            } else {
                resultado.valorHbA1cInicial = primeraFicha ? primeraFicha.valor_hbac1 : 'No registrado';
                resultado.valorHbA1cFinal = ultimaFicha ? ultimaFicha.valor_hbac1 : 'No registrado';

                // Comparar valores HbA1c
                resultado.estadoHbA1c = compararHbA1c(resultado.valorHbA1cInicial, resultado.valorHbA1cFinal);
            }

            return resultado;
        }));

        // Definir columnas dinámicamente
        const columnasBase = [
            { header: 'Tipo', key: 'tipo' },
            { header: 'RUT', key: 'rut' },
            { header: 'Nombres', key: 'nombres' },
            { header: 'Apellidos', key: 'apellidos' },
            { header: 'Institución', key: 'institucion' },
            { header: 'Tipo Institución', key: 'tipoInstitucion' },
            { header: 'Fecha Inicial', key: 'fechaInicial' },
            { header: 'Fecha Final', key: 'fechaFinal' },
            { header: 'Reevaluaciones', key: 'reevaluaciones' }
        ];

        // Agregar columnas específicas según el tipo de ficha o si se exportan ambos
        const columnasExtras = tipoFichaFinal === 'infantil'
            ? [
                { header: 'Diagnóstico DSM Inicial', key: 'diagnosticoDSMInicial' },
                { header: 'Diagnóstico DSM Final', key: 'diagnosticoDSMFinal' },
                { header: 'Estado Diagnóstico', key: 'estadoDiagnostico' }
            ]
            : tipoFichaFinal === 'adulto'
                ? [
                    { header: 'Valor HbA1c Inicial', key: 'valorHbA1cInicial' },
                    { header: 'Valor HbA1c Final', key: 'valorHbA1cFinal' },
                    { header: 'Estado HbA1c', key: 'estadoHbA1c' }
                ]
                : [
                    // Si no hay tipo específico, incluir columnas de ambos
                    { header: 'Diagnóstico DSM Inicial', key: 'diagnosticoDSMInicial' },
                    { header: 'Diagnóstico DSM Final', key: 'diagnosticoDSMFinal' },
                    { header: 'Estado Diagnóstico', key: 'estadoDiagnostico' },
                    { header: 'Valor HbA1c Inicial', key: 'valorHbA1cInicial' },
                    { header: 'Valor HbA1c Final', key: 'valorHbA1cFinal' },
                    { header: 'Estado HbA1c', key: 'estadoHbA1c' }
                ];

        // Crear el archivo Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Fichas Clínicas');

        // Definir columnas
        worksheet.columns = [...columnasBase, ...columnasExtras];

        // Agregar datos
        worksheet.addRows(datosExportacion);

        // Ajustar automáticamente el ancho de las columnas
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
                if (cell.value) {
                    maxLength = Math.max(maxLength, cell.value.toString().length);
                }
            });
            column.width = maxLength + 2; // +2 para un poco de espacio extra
        });

        // Generar y enviar el archivo Excel
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Disposition', `attachment; filename=fichas_clinicas_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Error al exportar fichas clínicas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al exportar las fichas clínicas',
            error: error.message
        });
    }
};

// Función para comparar diagnósticos infantiles
const compararDiagnosticos = (inicial, final) => {
    const estados = ['Retraso', 'Riesgo', 'Normal'];
    const indiceInicial = estados.indexOf(inicial);
    const indiceFinal = estados.indexOf(final);

    if (indiceInicial === -1 || indiceFinal === -1) return 'No registrado';

    if (indiceFinal > indiceInicial) return 'Mejoró';
    if (indiceFinal === indiceInicial) return 'Se mantuvo';
    return 'Empeoró';
};

// Función para comparar valores HbA1c
const compararHbA1c = (inicial, final) => {
    if (inicial === 'No registrado' || final === 'No registrado') return 'No registrado';

    const valorInicial = parseFloat(inicial);
    const valorFinal = parseFloat(final);

    if (valorFinal < valorInicial) return 'Mejoró';
    if (valorFinal === valorInicial) return 'Se mantuvo';
    return 'Empeoró';
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

        // Obtener el paciente_id de la ficha original
        let fichaOriginal;
        if (tipo === 'adulto') {
            fichaOriginal = await FichaClinicaAdulto.findByPk(id);
        } else if (tipo === 'infantil') {
            fichaOriginal = await FichaClinicaInfantil.findByPk(id);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Tipo de ficha no válido'
            });
        }
        if (!fichaOriginal) {
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica no encontrada'
            });
        }

        console.log(fichaOriginal.paciente_id);
        // Construir condiciones de filtrado
        const whereConditions = {
            paciente_id: fichaOriginal.paciente_id,
            is_reevaluacion: true // Asegúrate de que esto esté correcto
        };

        // Agregar filtro de fechas si están presentes
        if (fechaInicio || fechaFin) {
            whereConditions.createdAt = {};
            if (fechaInicio) {
                whereConditions.createdAt[Op.gte] = new Date(fechaInicio);
            }
            if (fechaFin) {
                whereConditions.createdAt[Op.lte] = new Date(fechaFin);
            }
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
                        model: DiagnosticoFichaAdulto,
                        as: 'DiagnosticoFichas', // Añade este alias
                        include: [{
                            model: Diagnostico,
                            as: 'Diagnostico', // Y este también
                            attributes: ['id', 'nombre']
                        }]
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
                        model: FichaTipoFamilia,
                        as: 'fichaTipoFamilia',
                        where: { tipo_ficha: 'adulto' },
                        required: false,
                        include: [{
                            model: TipoFamilia,
                            as: 'tipoFamiliaAdulto',
                            attributes: ['id', 'nombre']
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
                order: [['createdAt', 'DESC']],
                distinct: true
            });

        } else {
            resultado = await FichaClinicaInfantil.findAndCountAll({
                where: whereConditions,
                include: [
                    {
                        model: PacienteInfantil,
                        attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad', 'telefono_principal', 'telefono_secundario', 'fecha_nacimiento']
                    },
                    {
                        model: FichaTipoFamilia,
                        as: 'fichasTipoFamiliaInfantiles',
                        where: { tipo_ficha: 'infantil' },
                        required: false,
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
                order: [['createdAt', 'DESC']],
                distinct: true
            });
        }

        console.log('Conteo de registros:', resultado.count);

        // Formatear resultados
        const reevaluacionesFormateadas = resultado.rows && resultado.rows.length > 0
            ? resultado.rows.map(
                tipo === 'adulto'
                    ? formatearReevaluacionAdulto
                    : formatearReevaluacionInfantil
            )
            : [];

        console.log('Reevaluaciones formateadas:', reevaluacionesFormateadas);

        // Calcular total de páginas
        const totalPaginas = Math.ceil(resultado.count / parseInt(limite));

        res.json({
            success: true,
            data: reevaluacionesFormateadas,
            totalPaginas: totalPaginas,
            paginaActual: parseInt(pagina),
            totalRegistros: resultado.count
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
        diagnosticos: Array.isArray(reevaluacion.DiagnosticoFichas) ?
            reevaluacion.DiagnosticoFichas.map(diagnosticoFicha => ({
                id: diagnosticoFicha.Diagnostico?.id || null, // Asegúrate de que Diagnostico existe
                nombre: diagnosticoFicha.es_diagnostico_otro
                    ? diagnosticoFicha.diagnostico_otro_texto
                    : diagnosticoFicha.Diagnostico?.nombre || 'N/A', // Asegúrate de que Diagnostico existe
                esOtro: diagnosticoFicha.es_diagnostico_otro
            })) : [],
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
        tiposFamilia: reevaluacion.fichaTipoFamilia && reevaluacion.fichaTipoFamilia.length > 0
            ? reevaluacion.fichaTipoFamilia.map(fichaTipo => ({
                id: fichaTipo.tipo_familia_id,
                nombre: fichaTipo.nombre
                    ? null
                    : (fichaTipo.tipoFamiliaAdulto
                        ? fichaTipo.tipoFamiliaAdulto.nombre
                        : null),
                tipoFamiliaOtro: fichaTipo.tipo_familia_otro || null
            }))
            : [{
                id: null,
                nombre: null,
                tipoFamiliaOtro: null
            }],
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
        fecha_evaluacion: reevaluacion.createdAt,
        is_reevaluacion: reevaluacion.is_reevaluacion,
        paciente: {
            id: reevaluacion.PacienteInfantil.id,
            nombres: reevaluacion.PacienteInfantil.nombres,
            apellidos: reevaluacion.PacienteInfantil.apellidos,
            rut: reevaluacion.PacienteInfantil.rut,
            fechaNacimiento: reevaluacion.PacienteInfantil.fecha_nacimiento,
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
            tiposFamilia: reevaluacion.fichasTipoFamiliaInfantiles && reevaluacion.fichasTipoFamiliaInfantiles.length > 0
                ? reevaluacion.fichasTipoFamiliaInfantiles.map(fichaTipo => ({
                    id: fichaTipo.tipo_familia_id || (fichaTipo.tipoFamiliaInfantil ? fichaTipo.tipoFamiliaInfantil.id : null),
                    nombre: fichaTipo.tipo_familia_otro
                        ? null
                        : (fichaTipo.tipoFamiliaInfantil
                            ? fichaTipo.tipoFamiliaInfantil.nombre
                            : null),
                    tipoFamiliaOtro: fichaTipo.tipo_familia_otro || null
                }))
                : [{
                    id: null,
                    nombre: null,
                    tipoFamiliaOtro: null
                }],
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

//Actualizar
export const updateFichaClinicaAdulto = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;
        const {
            nombres,
            apellidos,
            rut,
            edad,
            diagnosticos_id,
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
            institucion_id
        } = req.body;

        // Verificar si la ficha clínica existe
        const fichaClinicaExistente = await FichaClinicaAdulto.findByPk(id, {
            include: [{ model: PacienteAdulto }],
            transaction: t
        });

        if (!fichaClinicaExistente) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica no encontrada'
            });
        }

        if (!diagnosticos_id || (diagnosticos_id.length === 0 && !diagnostico_otro)) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un diagnóstico (predefinido o personalizado)'
            });
        }

        // Actualizar paciente
        const [updatedPaciente] = await PacienteAdulto.update({
            nombres,
            apellidos,
            rut,
            edad,
            telefono_principal: telefonoPrincipal,
            telefono_secundario: telefonoSecundario
        }, {
            where: { id: fichaClinicaExistente.paciente_id },
            transaction: t
        });

        // Obtener o validar nivel de escolaridad
        const nivelEscolaridad = await NivelEscolaridad.findByPk(escolaridad, { transaction: t });
        if (!nivelEscolaridad) {
            await t.rollback();
            throw new Error('Nivel de escolaridad no válido');
        }

        // Actualizar ficha clínica
        const [updatedFichaClinica] = await FichaClinicaAdulto.update({
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
            institucion_id
        }, {
            where: { id },
            transaction: t
        });

        // Eliminar diagnósticos existentes
        await DiagnosticoFichaAdulto.destroy({
            where: { ficha_clinica_id: id },
            transaction: t
        });

        // Agregar nuevos diagnósticos
        if (diagnosticos_id && diagnosticos_id.length > 0) {
            const diagnosticosPromesas = diagnosticos_id.map(async (diagnosticoId) => {
                await DiagnosticoFichaAdulto.create({
                    ficha_clinica_id: id,
                    diagnostico_id: diagnosticoId,
                    es_diagnostico_otro: false
                }, { transaction: t });
            });
            await Promise.all(diagnosticosPromesas);
        }

        // Agregar diagnóstico personalizado si existe
        if (diagnostico_otro) {
            await DiagnosticoFichaAdulto.create({
                ficha_clinica_id: id,
                diagnostico_id: null,
                es_diagnostico_otro: true,
                diagnostico_otro_texto: diagnostico_otro
            }, { transaction: t });
        }

        // Manejar tipos de familia
        await FichaTipoFamilia.destroy({
            where: {
                ficha_clinica_id: id,
                tipo_ficha: 'adulto'
            },
            transaction: t
        });

        // Luego, crear nuevos tipos de familia
        if (tiposFamilia && tiposFamilia.length > 0) {
            await Promise.all(tiposFamilia.map(async (tipoId) => {
                // Verificar si es un ID de tipo de familia existente o 'Otras'
                const esOtro = tipoId === 'Otras';
                const tipoFamiliaIdReal = esOtro ? null : tipoId;

                await FichaTipoFamilia.create({
                    ficha_clinica_id: id,
                    tipo_familia_id: tipoFamiliaIdReal,
                    tipo_familia_otro: esOtro ? tipoFamiliaOtro : null,
                    tipo_ficha: 'adulto'
                }, { transaction: t });
            }));
        }

        await t.commit();

        res.status(200).json({
            success: true,
            message: 'Ficha clínica actualizada exitosamente'
        });

    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar ficha clínica:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la ficha clínica',
            error: error.message
        });
    }
};

export const updateFichaClinicaInfantil = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;
        const {
            fechaNacimiento,
            nombres,
            apellidos,
            rut,
            edad,
            telefonoPrincipal,
            telefonoSecundario,
            conQuienVive,
            tipoFamilia,
            tipoFamiliaOtro,
            cicloVitalFamiliar,
            localidad,
            padres,
            factoresRiesgoNino,
            factoresRiesgoFamiliares,
            otrosFactoresRiesgoFamiliares
        } = req.body;

        // Buscar la ficha clínica
        const fichaClinica = await FichaClinicaInfantil.findByPk(id, {
            transaction: t
        });

        if (!fichaClinica) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica no encontrada'
            });
        }

        // Buscar el paciente asociado
        const paciente = await PacienteInfantil.findByPk(fichaClinica.paciente_id, { transaction: t });

        if (!paciente) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        // Actualizar datos del paciente
        await paciente.update({
            nombres,
            apellidos,
            rut,
            edad,
            fecha_nacimiento: fechaNacimiento,
            telefono_principal: telefonoPrincipal,
            telefono_secundario: telefonoSecundario
        }, { transaction: t });

        // Actualizar datos de la ficha clínica
        await fichaClinica.update({
            con_quien_vive: conQuienVive,
            ciclo_vital_familiar_id: cicloVitalFamiliar,
            localidad
        }, { transaction: t });

        // Actualizar tipo de familia
        await FichaTipoFamilia.destroy({
            where: {
                ficha_clinica_id: id,
                tipo_ficha: 'infantil'
            },
            transaction: t
        });

        // Manejar tipos de familia
        if (tipoFamilia || tipoFamiliaOtro) {
            // Si es 'Otras' o hay un tipo de familia otro
            if (tipoFamilia === 'Otras' || tipoFamiliaOtro) {
                await FichaTipoFamilia.create({
                    ficha_clinica_id: id,
                    tipo_familia_id: tipoFamilia !== 'Otras' ? tipoFamilia : null,
                    tipo_familia_otro: tipoFamiliaOtro || null,
                    tipo_ficha: 'infantil'
                }, { transaction: t });
            } else {
                // Si es un tipo de familia predefinido
                await FichaTipoFamilia.create({
                    ficha_clinica_id: id,
                    tipo_familia_id: tipoFamilia,
                    tipo_familia_otro: null,
                    tipo_ficha: 'infantil'
                }, { transaction: t });
            }
        }


        // Actualizar factores de riesgo del niño
        await FichaFactorRiesgoNino.destroy({
            where: { ficha_clinica_id: id },
            transaction: t
        });
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

        // Actualizar factores de riesgo familiares
        await FichaFactorRiesgoFamiliar.destroy({
            where: { ficha_clinica_id: id },
            transaction: t
        });
        if (factoresRiesgoFamiliares && factoresRiesgoFamiliares.length > 0) {
            for (const factorNombre of factoresRiesgoFamiliares) {
                const factor = await FactorRiesgoFamiliar.findOne({
                    where: { nombre: factorNombre }
                });

                if (factor) {
                    await FichaFactorRiesgoFamiliar.create({
                        ficha_clinica_id: fichaClinica.id,
                        factor_riesgo_familiar_id: factor.id,
                        otras: factor.nombre === 'Otras' ? otrosFactoresRiesgoFamiliares : null
                    }, { transaction: t });
                }
            }
        }

        // Manejar "Otras" si se proporciona
        if (otrosFactoresRiesgoFamiliares && otrosFactoresRiesgoFamiliares.trim() !== '') {
            await FichaFactorRiesgoFamiliar.create({
                ficha_clinica_id: fichaClinica.id,
                factor_riesgo_familiar_id: factorOtras ? factorOtras.id : null,
                otras: otrosFactoresRiesgoFamiliares
            }, { transaction: t });
        }

        // Actualizar padres/tutores
        await PadreTutor.destroy({
            where: { ficha_clinica_id: id },
            transaction: t
        });
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

        res.json({
            success: true,
            message: 'Ficha clínica infantil actualizada exitosamente',
            data: {
                fichaClinica,
                paciente,
                requestData: req.body
            }
        });

    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar ficha clínica infantil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la ficha clínica infantil',
            error: error.message
        });
    }
};

export const updateReevaluacion = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            tipo,
            nombres,
            apellidos,
            rut,
            edad,
            diagnosticos_id,
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
            puntajeDPM,
            diagnosticoDSM,
            localidad,
            factoresRiesgoNino,
            factoresRiesgoFamiliares,
            otrosFactoresRiesgoFamiliares
        } = req.body;

        console.log(req.body);

        // Validar el tipo de reevaluación
        if (!tipo || (tipo !== 'adulto' && tipo !== 'infantil')) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de reevaluación inválido'
            });
        }

        // Seleccionar el modelo correcto según el tipo
        const ModeloFicha = tipo === 'adulto'
            ? FichaClinicaAdulto
            : FichaClinicaInfantil;

        // Buscar la reevaluación
        const reevaluacion = await ModeloFicha.findByPk(id, {
            include: [
                tipo === 'adulto'
                    ? { model: PacienteAdulto, as: 'PacienteAdulto' }
                    : { model: PacienteInfantil, as: 'PacienteInfantil' }
            ],
            transaction: t
        });

        if (!reevaluacion) {
            return res.status(404).json({
                success: false,
                message: 'Reevaluación no encontrada'
            });
        }

        // Datos comunes para actualización
        const datosComunes = {
            con_quien_vive: conQuienVive,
            ciclo_vital_familiar_id
        };

        // Preparar datos específicos para cada tipo de ficha
        const datosEspecificos = tipo === 'adulto'
            ? {
                escolaridad_id: escolaridad,
                ocupacion,
                direccion,
                horario_llamada: horarioLlamada,
                conectividad,
                valor_hbac1: valorHbac1 ? parseFloat(valorHbac1) : null,
                alcohol_drogas: factoresRiesgo?.alcoholDrogas || false,
                tabaquismo: factoresRiesgo?.tabaquismo || false,
                otros_factores: factoresRiesgo?.otros
            }
            : {
                puntaje_dpm: puntajeDPM,
                diagnostico_dsm: diagnosticoDSM,
                localidad
            };

        // Actualizar datos de la reevaluación
        await reevaluacion.update(
            {
                ...datosComunes,
                ...datosEspecificos
            },
            { transaction: t }
        );

        // Manejar diagnósticos para adultos
        if (tipo === 'adulto') {
            // Eliminar diagnósticos existentes
            await DiagnosticoFichaAdulto.destroy({
                where: { ficha_clinica_id: id },
                transaction: t
            });

            // Agregar nuevos diagnósticos
            if (diagnosticos_id && diagnosticos_id.length > 0) {
                const diagnosticosPromesas = diagnosticos_id.map(async (diagnosticoId) => {
                    await DiagnosticoFichaAdulto.create({
                        ficha_clinica_id: id,
                        diagnostico_id: diagnosticoId,
                        es_diagnostico_otro: false, // Para diagnósticos estándar
                        diagnostico_otro_texto: null // No aplica para diagnósticos estándar
                    }, { transaction: t });
                });

                await Promise.all(diagnosticosPromesas);
            }

            // Manejar el diagnóstico alternativo
            if (diagnostico_otro && diagnostico_otro.trim() !== '') {
                await DiagnosticoFichaAdulto.create({
                    ficha_clinica_id: id,
                    diagnostico_id: null, // No hay ID de diagnóstico estándar
                    es_diagnostico_otro: true, // Es un diagnóstico alternativo
                    diagnostico_otro_texto: diagnostico_otro // Texto del diagnóstico alternativo
                }, { transaction: t });
            }
        }

        // Actualizar datos del paciente
        const ModeloPaciente = tipo === 'adulto' ? PacienteAdulto : PacienteInfantil;
        const pacienteId = tipo === 'adulto'
            ? reevaluacion.paciente_id
            : reevaluacion.paciente_id;

        await ModeloPaciente.update(
            {
                nombres,
                apellidos,
                rut,
                edad,
                telefono_principal: telefonoPrincipal,
                telefono_secundario: telefonoSecundario
            },
            {
                where: { id: pacienteId },
                transaction: t
            }
        );

        // Manejar tipos de familia
        await FichaTipoFamilia.destroy({
            where: {
                ficha_clinica_id: id,
                tipo_ficha: tipo
            },
            transaction: t
        });

        if (tiposFamilia && tiposFamilia.length > 0) {
            const tipoFamiliaPromesas = tiposFamilia.map(async (tipoId) => {
                await FichaTipoFamilia.create({
                    ficha_clinica_id: id,
                    tipo_familia_id: tipoId !== 'Otras' ? tipoId : null,
                    tipo_familia_otro: tipoId === 'Otras' ? tipoFamiliaOtro : null,
                    tipo_ficha: tipo
                }, { transaction: t });
            });

            await Promise.all(tipoFamiliaPromesas);
        } else if (tipoFamiliaOtro) {
            await FichaTipoFamilia.create({
                ficha_clinica_id: id,
                tipo_familia_id: null,
                tipo_familia_otro: tipoFamiliaOtro,
                tipo_ficha: tipo
            }, { transaction: t });
        }

        // Manejar factores de riesgo para infantil
        if (tipo === 'infantil') {
            await FichaFactorRiesgoNino.destroy({
                where: { ficha_clinica_id: id },
                transaction: t
            });

            if (factoresRiesgoNino && factoresRiesgoNino.length > 0) {
                const factoresNino = await FactorRiesgoNino.findAll({
                    where: { nombre: factoresRiesgoNino },
                    transaction: t
                });

                const asociacionesNino = factoresNino.map(factor => ({
                    ficha_clinica_id: id,
                    factor_riesgo_nino_id: factor.id
                }));

                await FichaFactorRiesgoNino.bulkCreate(asociacionesNino, { transaction: t });
            }

            // Factores de riesgo familiares
            await FichaFactorRiesgoFamiliar.destroy({
                where: { ficha_clinica_id: id },
                transaction: t
            });

            if (factoresRiesgoFamiliares && factoresRiesgoFamiliares.length > 0) {
                const factoresPromesas = factoresRiesgoFamiliares.map(async (factorNombre) => {
                    const factor = await FactorRiesgoFamiliar.findOne({
                        where: { nombre: factorNombre },
                        transaction: t
                    });

                    if (factor) {
                        await FichaFactorRiesgoFamiliar.create({
                            ficha_clinica_id: id,
                            factor_riesgo_familiar_id: factor.id,
                            otras: factor.nombre === 'Otras' ? otrosFactoresRiesgoFamiliares : null
                        }, { transaction: t });
                    }
                });

                await Promise.all(factoresPromesas);
            }
        }

        await t.commit();

        // Recuperar la reevaluación actualizada
        const reevaluacionActualizada = await ModeloFicha.findByPk(id, {
            include: [
                tipo === 'adulto'
                    ? { model: PacienteAdulto, as: 'PacienteAdulto' }
                    : { model: PacienteInfantil, as: 'PacienteInfantil' },
                ...(tipo === 'adulto' ? [{
                    model: DiagnosticoFichaAdulto,
                    as: 'DiagnosticoFichas',
                    include: [{
                        model: Diagnostico,
                        as: 'Diagnostico'  // Agregar el alias aquí
                    }]
                }] : [])
            ]
        });

        res.json({
            success: true,
            message: 'Reevaluación actualizada exitosamente',
            data: reevaluacionActualizada
        });

    } catch (error) {
        console.error('Error al actualizar la reevaluación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la reevaluación',
            error: error.message
        });
    }
};

export const updateReevaluacionInfantil = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
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
            otrosFactoresRiesgoFamiliares
        } = req.body;

        // Buscar la reevaluación infantil
        const reevaluacion = await FichaClinicaInfantil.findByPk(id, {
            include: [{ model: PacienteInfantil, as: 'PacienteInfantil' }],
            transaction: t
        });

        if (!reevaluacion) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reevaluación infantil no encontrada'
            });
        }

        // Actualizar datos de la ficha clínica infantil
        await reevaluacion.update({
            con_quien_vive: conQuienVive,
            ciclo_vital_familiar_id: cicloVitalFamiliar,
            puntaje_dpm: puntajeDPM,
            diagnostico_dsm: diagnosticoDSM,
            localidad
        }, { transaction: t });

        // Actualizar datos del paciente infantil
        await PacienteInfantil.update({
            nombres,
            apellidos,
            rut,
            edad,
            fecha_nacimiento: fechaNacimiento,
            telefono_principal: telefonoPrincipal,
            telefono_secundario: telefonoSecundario
        }, {
            where: { id: reevaluacion.paciente_id },
            transaction: t
        });

        // Manejar padres/tutores
        await PadreTutor.destroy({
            where: { ficha_clinica_id: id },
            transaction: t
        });

        const padresPromesas = padres.map(padre =>
            PadreTutor.create({
                ficha_clinica_id: id,
                nombre: padre.nombre,
                escolaridad_id: padre.escolaridad,
                ocupacion: padre.ocupacion
            }, { transaction: t })
        );
        await Promise.all(padresPromesas);

        // Manejar tipos de familia
        await FichaTipoFamilia.destroy({
            where: {
                ficha_clinica_id: id,
                tipo_ficha: 'infantil'
            },
            transaction: t
        });

        // Crear nuevo registro de tipo de familia
        if (tipoFamilia === null) {
            // Si tipoFamilia es null, registrar tipoFamiliaOtro
            await FichaTipoFamilia.create({
                ficha_clinica_id: id,
                tipo_familia_id: null, // Guardar null
                tipo_familia_otro: tipoFamiliaOtro, // Guardar el texto ingresado
                tipo_ficha: 'infantil'
            }, { transaction: t });
        } else {
            // Si hay un tipo de familia definido
            await FichaTipoFamilia.create({
                ficha_clinica_id: id,
                tipo_familia_id: tipoFamilia !== 'Otras' ? tipoFamilia : null, // Guardar ID o null
                tipo_familia_otro: tipoFamilia === 'Otras' ? tipoFamiliaOtro : null, // Guardar el texto ingresado
                tipo_ficha: 'infantil'
            }, { transaction: t });
        }

        // Manejar factores de riesgo del niño
        await FichaFactorRiesgoNino.destroy({
            where: { ficha_clinica_id: id },
            transaction: t
        });

        if (factoresRiesgoNino && factoresRiesgoNino.length > 0) {
            const factoresNino = await FactorRiesgoNino.findAll({
                where: { nombre: factoresRiesgoNino },
                transaction: t
            });

            const asociacionesNino = factoresNino.map(factor => ({
                ficha_clinica_id: id,
                factor_riesgo_nino_id: factor.id
            }));

            await FichaFactorRiesgoNino.bulkCreate(asociacionesNino, { transaction: t });
        }

        // Manejar factores de riesgo familiares
        await FichaFactorRiesgoFamiliar.destroy({
            where: { ficha_clinica_id: id },
            transaction: t
        });

        if (factoresRiesgoFamiliares && factoresRiesgoFamiliares.length > 0) {
            const factoresPromesas = factoresRiesgoFamiliares.map(async (factorNombre) => {
                const factor = await FactorRiesgoFamiliar.findOne({
                    where: { nombre: factorNombre },
                    transaction: t
                });

                if (factor) {
                    await FichaFactorRiesgoFamiliar.create({
                        ficha_clinica_id: id,
                        factor_riesgo_familiar_id: factor.id,
                        otras: factor.nombre === 'Otras' ? otrosFactoresRiesgoFamiliares : null
                    }, { transaction: t });
                }
            });

            await Promise.all(factoresPromesas);
        }

        // Manejar el caso de "Otras" para factores de riesgo familiares
        if (otrosFactoresRiesgoFamiliares && otrosFactoresRiesgoFamiliares.trim() !== '') {
            await FichaFactorRiesgoFamiliar.create({
                ficha_clinica_id: id,
                factor_riesgo_familiar_id: 5, // ID para "Otras"
                otras: otrosFactoresRiesgoFamiliares
            }, { transaction: t });
        }

        await t.commit();

        // Recuperar la reevaluación actualizada
        const reevaluacionActualizada = await FichaClinicaInfantil.findByPk(id, {
            include: [{ model: PacienteInfantil, as: 'PacienteInfantil' }]
        });

        res.json({
            success: true,
            message: 'Reevaluación infantil actualizada exitosamente',
            data: reevaluacionActualizada
        });

    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar la reevaluación infantil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la reevaluación infantil',
            error: error.message
        });
    }
};