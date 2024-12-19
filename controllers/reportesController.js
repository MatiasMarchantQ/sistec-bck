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
const currentYear = new Date().getFullYear();

// Modificar de manera similar obtenerEvolucionPacientes
const obtenerEvolucionPacientes = async (year, semestreFiltro) => {
    // Función para obtener años con registros
    const obtenerAnosRegistrados = async (modelo) => {
        const condicionTemporal = year ? {
            createdAt: {
                [Op.gte]: moment(`${year}-01-01`).startOf('year').toDate(),
                [Op.lte]: moment(`${year}-12-31`).endOf('year').toDate()
            }
        } : {
            createdAt: {
                [Op.gte]: moment().subtract(5, 'years').startOf('year').toDate(),
                [Op.lte]: moment().endOf('year').toDate()
            }
        };

        const anosRegistrados = await modelo.findAll({
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.fn('YEAR', sequelize.col('createdAt'))), 'year']
            ],
            where: condicionTemporal,
            order: [['year', 'ASC']],
            raw: true
        });

        return anosRegistrados.map(a => a.year).sort((a, b) => a - b);
    };

    // Obtener años para adultos e infantiles
    const anosAdultos = await obtenerAnosRegistrados(FichaClinicaAdulto);
    const anosInfantiles = await obtenerAnosRegistrados(FichaClinicaInfantil);

    // Combinar años únicos
    const anosUnicos = [...new Set([...anosAdultos, ...anosInfantiles])].sort((a, b) => a - b);

    // Función para obtener datos de pacientes
    const obtenerPacientesParaAno = async (ano) => {
        // Condición base para el año
        const generarWhereCondition = (modelo) => {
            const condicion = {
                createdAt: {
                    [Op.gte]: moment(`${ano}-01-01`).startOf('year').toDate(),
                    [Op.lte]: moment(`${ano}-12-31`).endOf('year').toDate()
                }
            };

            // Ajustar condición para semestre si es necesario
            if (semestreFiltro === 'primero') {
                // Solo para infantiles
                if (modelo === FichaClinicaInfantil) {
                    condicion.createdAt = {
                        [Op.gte]: moment(`${ano}-01-01`).startOf('day').toDate(),
                        [Op.lte]: moment(`${ano}-06-30`).endOf('day').toDate()
                    };
                } else {
                    // Para adultos, devolver objeto vacío para no incluir resultados
                    return null;
                }
            } else if (semestreFiltro === 'segundo') {
                // Solo para adultos
                if (modelo === FichaClinicaAdulto) {
                    condicion.createdAt = {
                        [Op.gte]: moment(`${ano}-07-01`).startOf('day').toDate(),
                        [Op.lte]: moment(`${ano}-12-31`).endOf('day').toDate()
                    };
                } else {
                    // Para infantiles, devolver objeto vacío para no incluir resultados
                    return null;
                }
            }

            return condicion;
        };

        // Función para obtener estadísticas de un modelo
        const obtenerEstadisticasModelo = async (modelo) => {
            const whereCondition = generarWhereCondition(modelo);

            // Si no hay condición para este modelo en el semestre, retornar null
            if (!whereCondition) return null;

            // Total de fichas
            const totalFichas = await modelo.count({
                where: whereCondition
            });

            // Pacientes únicos
            const totalPacientes = await modelo.count({
                distinct: true,
                col: 'paciente_id',
                where: whereCondition
            });

            // Fichas iniciales
            const fichasIniciales = await modelo.count({
                where: {
                    ...whereCondition,
                    is_reevaluacion: 0
                }
            });

            const pacientesConFichasIniciales = await modelo.count({
                distinct: true,
                col: 'paciente_id',
                where: {
                    ...whereCondition,
                    is_reevaluacion: 0
                }
            });

            // Total de reevaluações
            const totalReevaluaciones = await modelo.count({
                where: {
                    ...whereCondition,
                    is_reevaluacion: 1
                }
            });

            // Pacientes reevaluados
            const pacientesReevaluados = await modelo.count({
                distinct: true,
                col: 'paciente_id',
                where: {
                    ...whereCondition,
                    is_reevaluacion: 1
                }
            });

            return {
                totalFichas,
                totalPacientes,
                fichasIniciales,
                pacientesConFichasIniciales,
                totalReevaluaciones,
                pacientesReevaluados
            };
        };

        // Obtener estadísticas para adultos e infantiles
        const estadisticasAdultos = await obtenerEstadisticasModelo(FichaClinicaAdulto);
        const estadisticasInfantiles = await obtenerEstadisticasModelo(FichaClinicaInfantil);

        return {
            year: ano,
            adultos: estadisticasAdultos,
            infantiles: estadisticasInfantiles
        };
    };

    // Si se especifica um ano, devolver solo esse ano
    if (year) {
        return [await obtenerPacientesParaAno(year)];
    }

    // Si es "Todos los Años", obtener pacientes para todos los años
    const resultados = await Promise.all(anosUnicos.map(obtenerPacientesParaAno));

    // Filtrar resultados nulos y aquellos sin datos
    const resultadosFiltrados = resultados.filter(resultado => 
        resultado && 
        (resultado.adultos || resultado.infantiles)
    );

    // Opcional: Imprimir información de depuración
    console.log('Evolución de Pacientes:', JSON.stringify(resultadosFiltrados, null, 2));

    return resultadosFiltrados;
};

const obtenerEvolucionDiagnosticosInfantiles = async (year, semestreFiltro) => {
    // Función para obtener años registrados
    const obtenerAnosRegistrados = async () => {
        return await FichaClinicaInfantil.findAll({
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.fn('YEAR', sequelize.col('createdAt'))), 'year']
            ],
            where: year ? {
                createdAt: {
                    [Op.gte]: moment(`${year}-01-01`).startOf('year').toDate(),
                    [Op.lte]: moment(`${year}-12-31`).endOf('year').toDate()
                }
            } : {
                createdAt: {
                    [Op.gte]: moment().subtract(5, 'years').startOf('year').toDate(),
                    [Op.lte]: moment().endOf('year').toDate()
                }
            },
            order: [['year', 'ASC']],
            raw: true
        });
    };

    // Obtener años registrados
    const anosRegistrados = await obtenerAnosRegistrados();
    const anosUnicos = anosRegistrados.map(a => a.year).sort((a, b) => a - b);

    // Función para construir condición de filtro por año y mes
    const construirWhereCondition = (ano, mes = null) => {
        let whereCondition = {
            createdAt: ano ? {
                [Op.gte]: moment(`${ano}-01-01`).startOf('year').toDate(),
                [Op.lte]: moment(`${ano}-12-31`).endOf('year').toDate()
            } : {
                [Op.gte]: moment().subtract(5, 'years').startOf('year').toDate(),
                [Op.lte]: moment().endOf('year').toDate()
            }
        };

        // Si se especifica un mes, ajustar la condición
        if (mes !== null) {
            whereCondition.createdAt = {
                [Op.gte]: moment(`${ano}-${mes + 1}-01`).startOf('month').toDate(),
                [Op.lte]: moment(`${ano}-${mes + 1}-01`).endOf('month').toDate()
            };
        }

        // Ajustar condición para semestre si es necesario
        if (semestreFiltro === 'primero') {
            whereCondition.createdAt = {
                [Op.gte]: moment(`${ano}-01-01`).startOf('day').toDate(),
                [Op.lte]: moment(`${ano}-06-30`).endOf('day').toDate()
            };
        } else if (semestreFiltro === 'segundo') {
            whereCondition.createdAt = {
                [Op.gte]: moment(`${ano}-07-01`).startOf('day').toDate(),
                [Op.lte]: moment(`${ano}-12-31`).endOf('day').toDate()
            };
        }

        return whereCondition;
    };

    // Función para obtener diagnósticos infantiles por año o mes
    const obtenerDiagnosticosInfantiles = async (ano = null, mes = null) => {
        // Condición base para el año completo
        let whereCondition = {
            createdAt: ano ? {
                [Op.gte]: moment(`${ano}-01-01`).startOf('year').toDate(),
                [Op.lte]: moment(`${ano}-12-31`).endOf('year').toDate()
            } : {
                [Op.gte]: moment().subtract(5, 'years').startOf('year').toDate(),
                [Op.lte]: moment().endOf('year').toDate()
            }
        };
    
        // Si se especifica un mes, ajustar la condición
        if (mes !== null) {
            whereCondition.createdAt = {
                [Op.gte]: moment(`${ano}-${mes + 1}-01`).startOf('month').toDate(),
                [Op.lte]: moment(`${ano}-${mes + 1}-01`).endOf('month').toDate()
            };
        }
    
        // Obtener fichas iniciales del año/mes
        const fichasIniciales = await FichaClinicaInfantil.findAll({
            where: {
                ...whereCondition,
                is_reevaluacion: 0
            },
            order: [['createdAt', 'ASC']],
            raw: false
        });
    
        // Obtener todas las reevaluaciones para los pacientes con fichas iniciales
        const pacientesConFichasIniciales = fichasIniciales.map(ficha => ficha.paciente_id);
        
        const reevaluaciones = await FichaClinicaInfantil.findAll({
            where: {
                paciente_id: { [Op.in]: pacientesConFichasIniciales },
                createdAt: ano ? {
                    [Op.gte]: moment(`${ano}-01-01`).startOf('year').toDate(),
                    [Op.lte]: moment(`${ano}-12-31`).endOf('year').toDate()
                } : {
                    [Op.gte]: moment().subtract(5, 'years').startOf('year').toDate(),
                    [Op.lte]: moment().endOf('year').toDate()
                },
                is_reevaluacion: 1
            },
            order: [['createdAt', 'ASC']],
            raw: true
        });
    
        // Mapeo de orden de diagnósticos
        const ordenDiagnosticos = ['Normal', 'Riesgo', 'Retraso'];
    
        // Agrupar diagnósticos
        const diagnosticosIniciales = {};
        const diagnosticosFinales = {};
        const evolucionDiagnosticos = {
            'Normal': { mejora: 0, empeora: 0, sinCambios: 0 },
            'Riesgo': { mejora: 0, empeora: 0, sinCambios: 0 },
            'Retraso': { mejora: 0, empeora: 0, sinCambios: 0 }
        };
    
        // Procesar fichas iniciales
        fichasIniciales.forEach(ficha => {
            const diagnostico = ficha.diagnostico_dsm || 'Sin Diagnóstico';
            diagnosticosIniciales[diagnostico] = (diagnosticosIniciales[diagnostico] || 0) + 1;
        });
    
        // Procesar reevaluaciones
        reevaluaciones.forEach(reevaluacion => {
            // Encontrar la ficha inicial original para este paciente
            const fichaInicial = fichasIniciales.find(
                ficha => ficha.paciente_id === reevaluacion.paciente_id
            );
    
            if (fichaInicial) {
                const diagnosticoInicial = fichaInicial.diagnostico_dsm || 'Sin Diagnóstico';
                const diagnosticoFinal = reevaluacion.diagnostico_dsm || 'Sin Diagnóstico';
    
                // Contar diagnósticos finales
                diagnosticosFinales[diagnosticoFinal] = 
                    (diagnosticosFinales[diagnosticoFinal] || 0) + 1;
    
                // Calcular evolución
                const indiceInicial = ordenDiagnosticos.indexOf(diagnosticoInicial);
                const indiceFinal = ordenDiagnosticos.indexOf(diagnosticoFinal);
    
                const evolucion = 
                    indiceFinal < indiceInicial ? 'mejora' :
                    indiceFinal > indiceInicial ? 'empeora' : 'sinCambios';
    
                evolucionDiagnosticos[diagnosticoInicial][evolucion]++;
            }
        });
    
        return { 
            diagnosticosIniciales,
            diagnosticosFinales,
            evolucionDiagnosticos,
            totalFichasIniciales: fichasIniciales.length,
            totalReevaluaciones: reevaluaciones.length
        };
    };
    
    // Si es "Todos los Años", devolver resultados por año
    const resultadosPorAno = await Promise.all(
        anosUnicos.map(async (ano) => {
            const { 
                diagnosticosIniciales, 
                diagnosticosFinales, 
                evolucionDiagnosticos, 
                totalFichasIniciales, 
                totalReevaluaciones 
            } = await obtenerDiagnosticosInfantiles(ano);
    
            return {
                year: ano,
                diagnosticosIniciales,
                diagnosticosFinales,
                evolucionDiagnosticos,
                totalFichasIniciales,
                totalReevaluaciones
            };
        })
    );
    
    return resultadosPorAno;
};

const obtenerEvolucionDiagnosticosAdultos = async (year, semestreFiltro) => {
    // Función para obtener años registrados
    const obtenerAnosRegistrados = async () => {
        return await FichaClinicaAdulto.findAll({
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.fn('YEAR', sequelize.col('createdAt'))), 'year']
            ],
            where: year ? {
                createdAt: {
                    [Op.gte]: moment(`${year}-01-01`).startOf('year').toDate(),
                    [Op.lte]: moment(`${year}-12-31`).endOf('year').toDate()
                }
            } : {
                createdAt: {
                    [Op.gte]: moment().subtract(5, 'years').startOf('year').toDate(),
                    [Op.lte]: moment().endOf('year').toDate()
                }
            },
            order: [['year', 'ASC']],
            raw: true
        });
    };

    // Obtener años registrados
    const anosRegistrados = await obtenerAnosRegistrados();
    const anosUnicos = anosRegistrados.map(a => a.year).sort((a, b) => a - b);

    // Función para construir condición de filtro por año y mes
    const construirWhereCondition = (ano, mes = null) => {
        let whereCondition = {
            createdAt: ano ? {
                [Op.gte]: moment(`${ano}-01-01`).startOf('year').toDate(),
                [Op.lte]: moment(`${ano}-12-31`).endOf('year').toDate()
            } : {
                [Op.gte]: moment().subtract(5, 'years').startOf('year').toDate(),
                [Op.lte]: moment().endOf('year').toDate()
            }
        };

        // Si se especifica un mes, ajustar la condición
        if (mes !== null) {
            whereCondition.createdAt = {
                [Op.gte]: moment(`${ano}-${mes + 1}-01`).startOf('month').toDate(),
                [Op.lte]: moment(`${ano}-${mes + 1}-01`).endOf('month').toDate()
            };
        }

        // Ajustar condición para semestre si es necesario
        if (semestreFiltro === 'primero') {
            whereCondition.createdAt = {
                [Op.gte]: moment(`${ano}-01-01`).startOf('day').toDate(),
                [Op.lte]: moment(`${ano}-06-30`).endOf('day').toDate()
            };
        } else if (semestreFiltro === 'segundo') {
            whereCondition.createdAt = {
                [Op.gte]: moment(`${ano}-07-01`).startOf('day').toDate(),
                [Op.lte]: moment(`${ano}-12-31`).endOf('day').toDate()
            };
        }

        return whereCondition;
    };

    // Función para obtener diagnósticos agrupados por paciente
    const obtenerDiagnosticosAdultos = async () => {
        const whereCondition = construirWhereCondition(year);

        // Obtener último registro por paciente
        const ultimoRegistroPorPaciente = await FichaClinicaAdulto.findAll({
            attributes: [
                'paciente_id',
                [sequelize.fn('MAX', sequelize.col('id')), 'ultimaFicha']
            ],
            where: whereCondition,
            group: ['paciente_id'],
            raw: true
        });

        // Obtener detalles de los últimos registros
        const ultimosDiagnosticos = await Promise.all(
            ultimoRegistroPorPaciente.map(async (registro) => {
                // Primero buscar registro con is_reevaluacion = 1
                let ultimaFicha = await FichaClinicaAdulto.findOne({
                    where: {
                        id: registro.ultimaFicha,
                        is_reevaluacion: 1
                    },
                    raw: false
                });

                // Si no hay registro con is_reevaluacion = 1, buscar el original
                if (!ultimaFicha) {
                    ultimaFicha = await FichaClinicaAdulto.findOne({
                        where: {
                            paciente_id: registro.paciente_id,
                            is_reevaluacion: 0
                        },
                        raw: false
                    });
                }

                // Buscar ficha inicial para comparación
                const fichaInicial = await FichaClinicaAdulto.findOne({
                    where: {
                        paciente_id: registro.paciente_id,
                        is_reevaluacion: 0
                    },
                    order: [['createdAt', 'ASC']],
                    raw: false
                });

                return { ultimaFicha, fichaInicial };
            })
        );

        // Función de comparación de HbA1c
        const compararHbA1c = (inicial, final) => {
            if (final < inicial) return 'mejora';
            if (final > inicial) return 'empeora';
            return 'sinCambios';
        };

        // Filtrar registros válidos y contar diagnósticos
        const diagnosticosCounts = {};
        const estadisticasEvolucion = {};
        const diagnosticosDetallados = [];

        ultimosDiagnosticos.forEach(({ ultimaFicha, fichaInicial }) => {
            if (ultimaFicha && fichaInicial) {
                const diagnosticoInicial = 'Valor HbA1c Inicial';
                const diagnosticoFinal = 'Valor HbA1c Final';

                // Almacenar diagnóstico detallado
                diagnosticosDetallados.push({
                    pacienteId: ultimaFicha.paciente_id,
                    valorInicial: fichaInicial.valor_hbac1,
                    valorFinal: ultimaFicha.valor_hbac1,
                    fechaInicial: fichaInicial.createdAt,
                    fechaFinal: ultimaFicha.createdAt
                });
    
                // Conteo de diagnósticos
                diagnosticosCounts[diagnosticoInicial] = (diagnosticosCounts[diagnosticoInicial] || 0) + 1;
    
                // Inicializar estructura de evolución
                if (!estadisticasEvolucion[diagnosticoInicial]) {
                    estadisticasEvolucion[diagnosticoInicial] = {
                        total: 0,
                        evolucion: {
                            mejora: 0,
                            empeora: 0,
                            sinCambios: 0
                        },
                        distribucionFinal: {}
                    };
                }
    
                // Calcular evolución
                const cambio = compararHbA1c(
                    fichaInicial.valor_hbac1, 
                    ultimaFicha.valor_hbac1
                );
    
                estadisticasEvolucion[diagnosticoInicial].total++;
                estadisticasEvolucion[diagnosticoInicial].evolucion[
                    cambio === 'mejora' ? 'mejora' :
                    cambio === 'empeora' ? 'empeora' : 'sinCambios'
                ]++;
    
                // Distribución de diagnósticos finales
                estadisticasEvolucion[diagnosticoInicial].distribucionFinal[diagnosticoFinal] = 
                    (estadisticasEvolucion[diagnosticoInicial].distribucionFinal[diagnosticoFinal] || 0) + 1;
            }
        });
    
        // Convertir a array y ordenar
        const diagnosticos = Object.entries(diagnosticosCounts).map(([nombre, total]) => {
            const evolucion = estadisticasEvolucion[nombre] || { 
                total: 0, 
                evolucion: { mejora: 0, empeora: 0, sinCambios: 0 }, 
                distribucionFinal: {} 
            };
            return { nombre, total, evolucion };
        });

        return {
            diagnosticos,
            diagnosticosDetallados
        };
    };

    // Obtener diagnósticos de adultos
    const resultadosDiagnosticos = await obtenerDiagnosticosAdultos();
    return resultadosDiagnosticos;
};

const obtenerEvolucionReevaluaciones = async (year, semestreFiltro) => {
    // Consulta para obtener todos los años con registros
    const anosRegistrados = await FichaClinicaAdulto.findAll({
        attributes: [
            [sequelize.fn('DISTINCT', sequelize.fn('YEAR', sequelize.col('createdAt'))), 'year']
        ],
        where: {
            is_reevaluacion: 1,
            ...(year ? {
                createdAt: {
                    [Op.gte]: moment(`${year}-01-01`).startOf('year').toDate(),
                    [Op.lte]: moment(`${year}-12-31`).endOf('year').toDate()
                }
            } : {
                createdAt: {
                    [Op.gte]: moment().subtract(5, 'years').startOf('year').toDate(),
                    [Op.lte]: moment().endOf('year').toDate()
                }
            })
        },
        order: [['year', 'ASC']],
        raw: true
    });

    const anosUnicos = anosRegistrados.map(a => a.year).sort((a, b) => a - b);

    // Función para obtener reevaluaciones por año
    const obtenerReevaluacionesParaAno = async (ano) => {
        const whereCondition = {
            is_reevaluacion: 1,
            createdAt: {
                [Op.gte]: moment(`${ano}-01-01`).startOf('year').toDate(),
                [Op.lte]: moment(`${ano}-12-31`).endOf('year').toDate()
            }
        };

        // Ajustar condición para semestre si es necesario
        if (semestreFiltro === 'primero') {
            whereCondition.createdAt = {
                [Op.gte]: moment(`${ano}-01-01`).startOf('day').toDate(),
                [Op.lte]: moment(`${ano}-06-30`). endOf('day').toDate()
            };
        } else if (semestreFiltro === 'segundo') {
            whereCondition.createdAt = {
                [Op.gte]: moment(`${ano}-07-01`).startOf('day').toDate(),
                [Op.lte]: moment(`${ano}-12-31`).endOf('day').toDate()
            };
        }

        const resultados = await FichaClinicaAdulto.findAll({
            attributes: [
                [sequelize.fn('YEAR', sequelize.col('createdAt')), 'year'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalReevaluaciones']
            ],
            where: whereCondition,
            group: ['year'],
            raw: true
        });

        return resultados.length > 0 
            ? { year: ano, totalReevaluaciones: resultados[0].totalReevaluaciones }
            : { year: ano, totalReevaluaciones: 0 };
    };

    // Si se especifica un año, devolver solo ese año
    if (year && year !== 0) {
        return [await obtenerReevaluacionesParaAno(year)];
    }

    // Si es "Todos los Años", obtener reevaluaciones para todos los años
    return await Promise.all(anosUnicos.map(obtenerReevaluacionesParaAno));
};

export const obtenerDatosDashboard = async (req, res) => {
    try {
        const { 
            year = currentYear,
            semestre: semestreFiltro,
            institucionId,
            fechaInicio: inicioParam, 
            fechaFin: finParam
        } = req.query;

        let inicioDb, finDb;
        if (year === 0) {
            // Si es "Todos los Años", obtener desde 5 años antes hasta el año actual
            const primerAno = Math.max(currentYear - 5, 2020); // Asegurar un año mínimo
            const ultimoAno = currentYear;

            inicioDb = moment(`${primerAno}-01-01`).startOf('year').toDate();
            finDb = moment(`${ultimoAno}-12-31`).endOf('year').toDate();
        } else {
            // Lógica existente para un año específico
            inicioDb = moment(`${year}-01-01`).startOf('year').toDate();
            finDb = moment(`${year}-12-31`).endOf('year').toDate();
        }

        // Ajustar fechas según el semestre
        if (semestreFiltro === 'primero') {
            inicioDb = moment(`${year}-01-01`).startOf('day').toDate();
            finDb = moment(`${year}-06-30`).endOf('day').toDate();
        } else if (semestreFiltro === 'segundo') {
            inicioDb = moment(`${year}-07-01`).startOf('day').toDate();
            finDb = moment(`${year}-12-31`).endOf('day').toDate();
        }

        // Convertir fechas a objetos moment o usar valores por defecto
        const fechaInicio = inicioParam 
            ? moment.tz(inicioParam, "America/Santiago") 
            : moment.tz(inicioDb, "America/Santiago");
        
        const fechaFin = finParam 
            ? moment.tz(finParam, "America/Santiago") 
            : moment.tz(finDb, "America/Santiago");

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
    const obtenerUltimoDiagnosticoPorPaciente = async (modelo, tipo, porAno = false) => {
        const subquery = await modelo.findAll({
            attributes: [
                'paciente_id',
                [sequelize.fn('MAX', sequelize.col('createdAt')), 'ultima_fecha']
            ],
            where: {
                ...(porAno ? {
                    createdAt: {
                        [Op.gte]: moment().subtract(5, 'years').startOf('year').toDate(),
                        [Op.lte]: moment().endOf('year').toDate()
                    }
                } : {
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
            group: ['paciente_id'],
            raw: true
        });
    
        // Verificar si subquery tiene resultados
        console.log('Subquery resultados:', subquery);
    
        const ultimosDiagnosticos = await Promise.all(subquery.map(async (item) => {
            const ultimaFicha = await modelo.findOne({
                where: {
                    paciente_id: item.paciente_id,
                    createdAt: item.ultima_fecha
                },
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
    
        // Verificar si ultimosDiagnosticos tiene resultados
        console.log('Últimos diagnósticos:', ultimosDiagnosticos);
    

        //Bueno
        const contadorDiagnosticos = ultimosDiagnosticos.reduce((acc, ficha) => {
            let diagnostico;

            // Para FichaClinicaAdulto
            if (modelo.name === 'FichaClinicaAdulto') {
                // Verificar si hay un diagnóstico relacionado
                if (ficha.diagnostico_id) {
                    // Si existe el diagnóstico relacionado, obtener el nombre
                    diagnostico = ficha['diagnostico.nombre'] || 'Sin Diagnóstico';
                } 
                // Si no hay diagnóstico de la relación, usar diagnóstico_otro de FichaClinicaAdulto
                else if (ficha.diagnostico_otro) {
                    diagnostico = ficha.diagnostico_otro;
                } 
                // Si no hay diagnóstico
                else {
                    diagnostico = 'Sin Diagnóstico';
                }
            } 
            // Para FichaClinicaInfantil
            else {
                // Usar diagnóstico DSM o mostrar "Sin Diagnóstico DSM"
                diagnostico = ficha.diagnostico_dsm || 'Sin Diagnóstico DSM';
            }

            // Asegurarse de que el diagnóstico no sea null o undefined
            if (diagnostico) {
                acc[diagnostico] = (acc[diagnostico] || 0) + 1;
            } else {
                acc['Sin Diagnóstico'] = (acc['Sin Diagnóstico'] || 0) + 1;
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

        const obtenerDiagnosticosPorAno = async (modelo, tipo) => {
            // Obtener años con registros
            const anosRegistrados = await modelo.findAll({
                attributes: [
                    [sequelize.fn('DISTINCT', sequelize.fn('YEAR', sequelize.col('createdAt'))), 'year']
                ],
                where: {
                    createdAt: {
                        [Op.gte]: inicioDb,
                        [Op.lte]: finDb
                    },
                    ...(institucionId ? { institucion_id: institucionId } : {
                        institucion_id: {
                            [Op.in]: tipo === 'infantil' 
                                ? idsInstitucionesInfantiles 
                                : tipo === 'adulto'
                                    ? idsInstitucionesAdultos
                                    : []
                        }
                    }),
                    ...(semestreFiltro === 'primero' ? {
                        createdAt: {
                            [Op.between]: [
                                moment(`${currentYear}-01-01`).startOf('day').toDate(),
                                moment(`${currentYear}-06-30`).endOf('day').toDate()
                            ]
                        }
                    } : semestreFiltro === 'segundo' ? {
                        createdAt: {
                            [Op.between]: [
                                moment(`${currentYear}-07-01`).startOf('day').toDate(),
                                moment(`${currentYear}-12-31`).endOf('day').toDate()
                            ]
                        }
                    } : {})
                },
                order: [['year', 'ASC']],
                raw: true
            });
        
            const resultados = await Promise.all(anosRegistrados.map(async (ano) => {
                // Condiciones para el año actual
                const whereCondition = {
                    createdAt: {
                        [Op.gte]: moment(`${ano.year}-01-01`).startOf('year').toDate(),
                        [Op.lte]: moment(`${ano.year}-12-31`).endOf('year').toDate()
                    },
                    ...(institucionId ? { institucion_id: institucionId } : {
                        institucion_id: {
                            [Op.in]: tipo === 'infantil' 
                                ? idsInstitucionesInfantiles 
                                : tipo === 'adulto'
                                    ? idsInstitucionesAdultos
                                    : []
                        }
                    }),
                    ...(semestreFiltro === 'primero' ? {
                        createdAt: {
                            [Op.between]: [
                                moment(`${ano.year}-01-01`).startOf('day').toDate(),
                                moment(`${ano.year}-06-30`).endOf('day').toDate()
                            ]
                        }
                    } : semestreFiltro === 'segundo' ? {
                        createdAt: {
                            [Op.between]: [
                                moment(`${ano.year}-07-01`).startOf('day').toDate(),
                                moment(`${ano.year}-12-31`).endOf('day').toDate()
                            ]
                        }
                    } : {})
                };
        
                // Obtener pacientes únicos con sus últimas fichas (reevaluación o inicial)
                const ultimasFichasPorPaciente = await modelo.findAll({
                    attributes: [
                        'paciente_id',
                        [sequelize.fn('MAX', sequelize.col('id')), 'ultimaFichaId']
                    ],
                    where: whereCondition,
                    group: ['paciente_id'],
                    raw: true
                });
        
                // Obtener detalles de las últimas fichas
                const diagnosticos = await Promise.all(
                    ultimasFichasPorPaciente.map(async (registro) => {
                        // Primero buscar reevaluación
                        let ultimaFicha = await modelo.findOne({
                            where: {
                                id: registro.ultimaFichaId,
                                paciente_id: registro.paciente_id,
                                is_reevaluacion: 1
                            },
                            ...(modelo.name === 'FichaClinicaAdulto' ? {
                                include: [{
                                    model: Diagnostico,
                                    as: 'diagnostico',
                                    attributes: ['nombre']
                                }]
                            } : {}),
                            raw: true
                        });
        
                        // Si no hay reevaluación, buscar ficha inicial
                        if (!ultimaFicha) {
                            ultimaFicha = await modelo.findOne({
                                where: {
                                    id: registro.ultimaFichaId,
                                    paciente_id: registro.paciente_id,
                                    is_reevaluacion: 0
                                },
                                ...(modelo.name === 'FichaClinicaAdulto' ? {
                                    include: [{
                                        model: Diagnostico,
                                        as: 'diagnostico',
                                        attributes: ['nombre']
                                    }]
                                } : {}),
                                raw: true
                            });
                        }
        
                        return ultimaFicha;
                    })
                );
        
                // Contar diagnósticos
                const contadorDiagnosticos = diagnosticos.reduce((acc, ficha) => {
                    let diagnostico;
        
                    // Para FichaClinicaAdulto
                    if (modelo.name === 'FichaClinicaAdulto') {
                        if (ficha.diagnostico_id) {
                            diagnostico = ficha['diagnostico.nombre'] || 'Sin Diagnóstico';
                        } else if (ficha.diagnostico_otro) {
                            diagnostico = ficha.diagnostico_otro;
                        } else {
                            diagnostico = 'Sin Diagnóstico';
                        }
                    } 
                    // Para FichaClinicaInfantil
                    else {
                        diagnostico = ficha.diagnostico_dsm || 'Sin Diagnóstico DSM';
                    }
        
                    if (diagnostico) {
                        acc[diagnostico] = (acc[diagnostico] || 0) + 1;
                    } else {
                        acc['Sin Diagnóstico'] = (acc['Sin Diagnóstico'] || 0) + 1;
                    }
        
                    return acc;
                }, {});
        
                // Convertir a array ordenado
                const diagnosticosArray = Object.entries(contadorDiagnosticos)
                    .map(([nombre, cantidad]) => ({
                        nombre,
                        cantidad
                    }))
                    .sort((a, b) => b.cantidad - a.cantidad);
        
                return {
                    year: ano.year,
                    diagnosticos: diagnosticosArray
                };
            }));
        
            return resultados;
        };

        const diagnosticosInfantiles = year === 0 
            ? await obtenerDiagnosticosPorAno(FichaClinicaInfantil, 'infantil') 
            : await obtenerUltimoDiagnosticoPorPaciente(FichaClinicaInfantil, 'infantil');

        const diagnosticosAdultos
        = year === 0 
            ? await obtenerDiagnosticosPorAno(FichaClinicaAdulto, 'adulto') 
            : await obtenerUltimoDiagnosticoPorPaciente(FichaClinicaAdulto, 'adulto');

        console.log('Diagnósticos infantiles:', diagnosticosInfantiles);
        console.log('Diagnósticos adultos:', diagnosticosAdultos);
        
        // En la consulta de fichasInfantiles
        const fichasInfantiles = await FichaClinicaInfantil.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalFichas'],
                [sequelize.fn('COUNT', sequelize.literal('DISTINCT paciente_id')), 'totalPacientes'],
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_reevaluacion = 0 THEN 1 END')), 'fichasIniciales'],
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

        // Fichas Clínicas de Adultos
        const fichasAdultos = await FichaClinicaAdulto.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalFichas'],
                [sequelize.fn('COUNT', sequelize.literal('DISTINCT paciente_id')), 'totalPacientes'],
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_reevaluacion = 0 THEN 1 END')), 'fichasIniciales'],
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


    // Obtener datos de tendencias
    const evolucionPacientes = await obtenerEvolucionPacientes(
        year === 0 ? null : Number(year), 
        semestreFiltro
    );
    const evolucionDiagnosticos = {
        adultos: await obtenerEvolucionDiagnosticosAdultos(  // Necesitarás crear este método para adultos
            year === 0 ? null : Number(year), 
            semestreFiltro
        ),
        infantiles: await obtenerEvolucionDiagnosticosInfantiles(
            year === 0 ? null : Number(year), 
            semestreFiltro
        )
    };
    const evolucionReevaluaciones = await obtenerEvolucionReevaluaciones(
        year === 0 ? null : Number(year), 
        semestreFiltro
    );
    
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
    tendencias: {
        evolucionPacientes,
        evolucionDiagnosticos,
        evolucionReevaluaciones
    },
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