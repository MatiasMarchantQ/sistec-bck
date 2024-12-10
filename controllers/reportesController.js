import FichaClinicaAdulto from '../models/FichaClinicaAdulto.js';
import FichaClinicaInfantil from '../models/FichaClinicaInfantil.js';
import Diagnostico from '../models/Diagnostico.js';
import Asignacion from '../models/Asignacion.js';
import { Op, Sequelize } from 'sequelize';
import Estudiante from '../models/Estudiante.js';
import Institucion from '../models/Institucion.js';
import TipoInstitucion from '../models/TipoInstitucion.js';
import sequelize from '../models/index.js';
import moment from 'moment-timezone';

export const obtenerDatosDashboard = async (req, res) => {
    try {
        const { 
            year,
            semestre: semestreFiltro,
            institucionId,
            fechaInicio: inicioParam, 
            fechaFin: finParam
        } = req.query;

        // Convertir fechas a objetos moment o usar valores por defecto
        const fechaInicio = inicioParam 
            ? moment.tz(inicioParam, "America/Santiago") 
            : moment.tz(moment().startOf('year'), "America/Santiago");
        
        const fechaFin = finParam 
            ? moment.tz(finParam, "America/Santiago") 
            : moment.tz(moment().endOf('year'), "America/Santiago");

        // Convertir a formato de base de datos (UTC)
        const inicioDb = fechaInicio.utc().toDate();
        const finDb = fechaFin.utc().toDate();

        // Función auxiliar para aplicar filtros de tiempo
        const aplicarFiltrosTiempo = () => ({
            where: {
                createdAt: {
                    [Op.between]: [inicioDb, finDb]
                }
            }
        });

        // Obtener IDs de instituciones para primer y segundo semestre
        const institucionesInfantiles = await Institucion.findAll({
            where: { tipo_id: 1 }, // Jardines infantiles
            attributes: ['id']
        });
        const idsInstitucionesInfantiles = institucionesInfantiles.map(i => i.id);

        const institucionesAdultos = await Institucion.findAll({
            where: { 
                tipo_id: {
                    [Op.in]: [2, 3] // CESFAM y POSTAS
                }
            },
            attributes: ['id']
        });
        const idsInstitucionesAdultos = institucionesAdultos.map(i => i.id);

        // Lógica para manejar los semestres
        let filtroTipoInstitucion = {};

        if (semestreFiltro === 'primero') {
            // Primer semestre: solo Jardines Infantiles (tipo 1)
            filtroTipoInstitucion = { tipo_id: 1 };
        } else if (semestreFiltro === 'segundo') {
            // Segundo semestre: CESFAM y POSTAS (tipos 2 y 3)
            filtroTipoInstitucion = { 
                tipo_id: {
                    [Op.in]: [2, 3]  // CESFAM y POSTAS
                }
            };
        } else {
            // Sin filtro de tipo de institución cuando no hay semestre específico
            filtroTipoInstitucion = {}; 
        }

        // Obtener IDs de instituciones según el filtro de semestre
        const institucionesPermitidas = await Institucion.findAll({
            where: filtroTipoInstitucion,
            attributes: ['id']
        });
        const idsInstitucionesPermitidas = institucionesPermitidas.map(i => i.id);

        // Modificar filtros de institución
        const filtrosInstitucion = institucionId 
        ? { institucion_id: institucionId }
        : (
            semestreFiltro === 'primero' 
                ? { institucion_id: { [Op.in]: idsInstitucionesInfantiles } }
                : semestreFiltro === 'segundo'
                    ? { institucion_id: { [Op.in]: idsInstitucionesAdultos } }
                    : {}
        );

        // En la función obtenerUltimoDiagnosticoPorPaciente
// Modificar la función obtenerUltimoDiagnosticoPorPaciente
const obtenerUltimoDiagnosticoPorPaciente = async (modelo, tipo) => {
    const subquery = await modelo.findAll({
        attributes: [
            'paciente_id',
            [sequelize.fn('MAX', sequelize.col('createdAt')), 'ultima_fecha']
        ],
        where: {
            ...(semestreFiltro === 'primero' ? {
                createdAt: {
                    [Op.between]: [
                        moment(`${year}-01-01`).startOf('day').toDate(),
                        moment(`${year}-06-30`).endOf('day').toDate()
                    ]
                }
            } : semestreFiltro === 'segundo' ? {
                createdAt: {
                    [Op.between]: [
                        moment(`${year}-07-01`).startOf('day').toDate(),
                        moment(`${year}-12-31`).endOf('day').toDate()
                    ]
                }
            } : {
                createdAt: {
                    [Op.between]: [
                        moment(`${year}-01-01`).startOf('day').toDate(),
                        moment(`${year}-12-31`).endOf('day').toDate()
                    ]
                }
            }),
            ...(institucionId ? { institucion_id: institucionId } : {
                institucion_id: {
                    [Op.in]: tipo === 'infantil' 
                        ? idsInstitucionesInfantiles 
                        : tipo === 'adulto'
                            ? idsInstitucionesAdultos
                            : []
                }
            })
        },
        // Eliminar include para FichaClinicaInfantil
        ...(modelo.name === 'FichaClinicaAdulto' ? {
            include: [{
                model: Diagnostico,
                as: 'diagnostico',
                attributes: ['nombre']
            }]
        } : {}),
        group: ['paciente_id'],
        ...(modelo.name === 'FichaClinicaAdulto' ? { 
            group: ['paciente_id', 'diagnostico.id'] 
        } : {}),
        raw: true
    });

    const ultimosDiagnosticos = await Promise.all(subquery.map(async (item) => {
        const ultimaFicha = await modelo.findOne({
            where: {
                paciente_id: item.paciente_id,
                createdAt: item.ultima_fecha
            },
            // Eliminar include para FichaClinicaInfantil
            ...(modelo.name === 'FichaClinicaAdulto' ? {
                include: [{
                    model: Diagnostico,
                    as: 'diagnostico',
                    attributes: ['nombre']
                }]
            } : {}),
            raw: true
        });

        return ultimaFicha;
    }));

    // Contar diagnósticos
    const contadorDiagnosticos = ultimosDiagnosticos.reduce((acc, ficha) => {
        // Para FichaClinicaAdulto
        if (modelo.name === 'FichaClinicaAdulto') {
            let diagnostico;
            
            // Priorizar diagnóstico de la tabla Diagnosticos
            if (ficha.diagnostico) {
                diagnostico = ficha.diagnostico.nombre;
            } 
            // Si no hay diagnóstico de la tabla, usar diagnóstico otro
            else if (ficha.diagnostico_otro) {
                diagnostico = ficha.diagnostico_otro;
            } 
            // Si no hay diagnóstico
            else {
                diagnostico = 'Sin Diagnóstico';
            }
            
            acc[diagnostico] = (acc[diagnostico] || 0) + 1;
        } 
        // Para FichaClinicaInfantil
        else {
            // Usar diagnóstico DSM o mostrar "Sin Diagnóstico DSM"
            const diagnostico = ficha.diagnostico_dsm || 'Sin Diagnóstico DSM';
            acc[diagnostico] = (acc[diagnostico] || 0) + 1;
        }
        
        return acc;
    }, {});

    // Ordenar diagnósticos por cantidad de mayor a menor
    return Object.entries(contadorDiagnosticos)
        .map(([nombre, cantidad]) => ({
            nombre,
            cantidad
        }))
        .sort((a, b) => b.cantidad - a.cantidad);
};

const diagnosticosInfantiles = await obtenerUltimoDiagnosticoPorPaciente(FichaClinicaInfantil, 'infantil');
const diagnosticosAdultos = await obtenerUltimoDiagnosticoPorPaciente(FichaClinicaAdulto, 'adulto');

// En la consulta de fichasInfantiles
const fichasInfantiles = await FichaClinicaInfantil.findAll({
    attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalFichas'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT paciente_id')), 'totalPacientes'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_reevaluacion = 0 THEN 1 END')), 'fichesIniciales'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_reevaluacion = 1 THEN 1 END')), 'totalReevaluaciones'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT CASE WHEN is_reevaluacion = 1 THEN paciente_id END')), 'pacientesReevaluados']
    ],
    where: {
        createdAt: {
            [Op.between]: [
                moment(`${year}-01-01`).startOf('day').toDate(),
                moment(`${year}-12-31`).endOf('day').toDate()
            ]
        },
        is_reevaluacion: 0,
        ...(institucionId 
            ? { institucion_id: institucionId } 
            : (semestreFiltro 
                ? { institucion_id: { [Op.in]: idsInstitucionesInfantiles } }
                : {}) // Sin filtro si no hay semestre
        )
    },
    raw: true
});

console.log('Fichas Infantiles Raw:', fichasInfantiles);

// Fichas Clínicas de Adultos
const fichasAdultos = await FichaClinicaAdulto.findAll({
    attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalFichas'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT paciente_id')), 'totalPacientes'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_reevaluacion = 0 THEN 1 END')), 'fichesIniciales'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_reevaluacion = 1 THEN 1 END')), 'totalReevaluaciones'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT CASE WHEN is_reevaluacion = 1 THEN paciente_id END')), 'pacientesReevaluados']
    ],
    where: {
        ...aplicarFiltrosTiempo().where,
        ...(institucionId ? { institucion_id: institucionId } : (
            semestreFiltro === 'primero' ? {
                createdAt: {
                    [Op.between]: [`${year}-01-01`, `${year}-06-30`]
                },
                institucion_id: { [Op.in]: idsInstitucionesInfantiles }
            } : semestreFiltro === 'segundo' ? {
                createdAt: {
                    [Op.between]: [`${year}-07-01`, `${year}-12-31`]
                },
                institucion_id: { [Op.in]: idsInstitucionesAdultos }
            } : {
                institucion_id: { [Op.in]: idsInstitucionesAdultos }
            }
        ))
    },
    raw: true
});

// Antes de las consultas de fichas
console.log('Filtros Institución:', filtrosInstitucion);
console.log('Semestre:', semestreFiltro);
console.log('Año:', year);
console.log('IDs Instituciones Infantiles:', idsInstitucionesInfantiles);
        

        // Datos de Estudiantes
        const totalEstudiantes = await Estudiante.count({
            where: {
                estado: 1, // Activo
                [Op.and]: [
                    { anos_cursados: { [Op.not]: null } },
                    { anos_cursados: { [Op.ne]: '' } },
                    // Filtrar por el año seleccionado
                    Sequelize.literal(`FIND_IN_SET('${year}', anos_cursados) > 0`)
                ]
            }
        });

        const estudiantesAsignados = await Asignacion.count({
            distinct: true,
            col: 'estudiante_id',
            where: {
                fecha_inicio: {
                    [Op.between]: [inicioDb, finDb]
                },
                ...filtrosInstitucion,
                // Filtrar estudiantes por el año seleccionado
                '$Estudiante.anos_cursados$': {
                    [Op.like]: `%${year}%`
                }
            },
            include: [{
                model: Estudiante,
                attributes: []
            }]
        });

        // Estadísticas por Institución
const estadisticasPorInstitucion = await Institucion.findAll({
    attributes: [
        'id', 
        'nombre',
        [
            sequelize.literal(`(
                SELECT COUNT(DISTINCT paciente_id)
                FROM fichas_clinicas_adultos 
                WHERE institucion_id = Institucion.id 
                AND is_reevaluacion = 0
                AND createdAt BETWEEN :fechaInicio AND :fechaFin
                ${semestreFiltro ? 'AND createdAt BETWEEN :inicioSemestre AND :finSemestre' : ''}
            )`),
            'fichasInicialesAdultos'
        ],
        [
            sequelize.literal(`(
                SELECT COUNT(DISTINCT paciente_id)
                FROM fichas_clinicas_adultos 
                WHERE institucion_id = Institucion.id 
                AND is_reevaluacion = 1
                AND createdAt BETWEEN :fechaInicio AND :fechaFin
            )`),
            'reevaluacionesAdultos'
        ],
        [
            sequelize.literal(`(
                SELECT COUNT(DISTINCT paciente_id)
                FROM fichas_clinicas_infantiles 
                WHERE institucion_id = Institucion.id 
                AND is_reevaluacion = 0
                AND createdAt BETWEEN :fechaInicio AND :fechaFin
            )`),
            'fichasInicialesInfantiles'
        ],
        [
            sequelize.literal(`(
                SELECT COUNT(DISTINCT paciente_id)
                FROM fichas_clinicas_infantiles 
                WHERE institucion_id = Institucion.id 
                AND is_reevaluacion = 1
                AND createdAt BETWEEN :fechaInicio AND :fechaFin
            )`),
            'reevaluacionesInfantiles'
        ]
    ],
    include: [{
        model: TipoInstitucion,
        as: 'tipoInstitucion',
        attributes: ['tipo']
    }],
    replacements: {
        fechaInicio: inicioDb,
        fechaFin: finDb,
        ...(semestreFiltro && {
            inicioSemestre: semestreFiltro === 'primero' 
                ? `${year}-01-01` 
                : `${year}-07-01`,
            finSemestre: semestreFiltro === 'primero' 
                ? `${year}-06-30` 
                : `${year}-12-31`
        })
    }
});

// Modificar la respuesta JSON para incluir el tipo de institución
res.json({
    pacientesAdultos: {
        diagnosticos: diagnosticosAdultos,
        fichas: fichasAdultos[0] || {}
    },
    pacientesInfantiles: {
        diagnosticos: diagnosticosInfantiles,
        fichas: fichasInfantiles[0] || {}
    },
    estudiantes: {
        total: totalEstudiantes,
        asignados: estudiantesAsignados
    },
    estadisticasPorInstitucion: estadisticasPorInstitucion.map(institucion => ({
        id: institucion.id,
        nombre: institucion.nombre,
        tipoInstitucion: institucion.tipoInstitucion ? institucion.tipoInstitucion.tipo : 'Sin Tipo',
        fichasInicialesAdultos: institucion.get('fichasInicialesAdultos'),
        reevaluacionesAdultos: institucion.get('reevaluacionesAdultos'),
        fichasInicialesInfantiles: institucion.get('fichasInicialesInfantiles'),
        reevaluacionesInfantiles: institucion.get('reevaluacionesInfantiles')
    })),
    parametros: {
        periodo: semestreFiltro,
        fechaInicio: inicioDb,
        fechaFin: finDb,
        institucionId
    }
});
    } catch (error) {
        console.error('Error al obtener datos del dashboard:', error);
        res.status(500).json({ 
            error: 'No se pudieron obtener los datos del dashboard', 
            detalle: error.message 
        });
    }
};