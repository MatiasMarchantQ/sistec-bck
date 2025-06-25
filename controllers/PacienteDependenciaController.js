import PacienteDependencia from '../models/PacienteDependencia.js';
import VisitaDomiciliaria from '../models/VisitaDomiciliaria.js';
import SintomasVisita from '../models/SintomasVisita.js';
import AdherenciaVisita from '../models/AdherenciaVisita.js';
import NutricionVisita from '../models/NutricionVisita.js';
import ActividadVisita from '../models/ActividadVisita.js';
import EliminacionVisita from '../models/EliminacionVisita.js';
import Phq9Visita from '../models/Phq9Visita.js';
import YesavageVisita from '../models/YesavageVisita.js';
import OtrosSintomasVisita from '../models/OtrosSintomasVisita.js';
import SeguimientoDependencia from '../models/SeguimientoDependencia.js';
import Estudiante from '../models/Estudiante.js';
import Usuario from '../models/Usuario.js';
import sequelize from '../models/index.js';
import { Op } from 'sequelize';

export const getPacientes = async (req, res) => {
    try {
        const pacientes = await PacienteDependencia.findAll();
        res.status(200).json({
            success: true,
            data: pacientes
        });
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pacientes',
            error: error.message
        });
    }
};

export const getVisitasDomiciliarias = async (req, res) => {
    const { paciente_dependencia_id } = req.params; // Obtener el pacienteId de los parámetros de la solicitud

    try {
        const visitas = await VisitaDomiciliaria.findAll({
            where: { paciente_dependencia_id }, // Filtrar por pacienteId
            include: [
                { model: SintomasVisita, as: 'sintomas', required: false },
                { model: AdherenciaVisita, as: 'adherencia', required: false },
                { model: NutricionVisita, as: 'nutricion', required: false },
                { model: ActividadVisita, as: 'actividad', required: false },
                { model: EliminacionVisita, as: 'eliminacion', required: false },
                { model: Phq9Visita, as: 'phq9', required: false },
                { model: YesavageVisita, as: 'yesavage', required: false },
                { model: OtrosSintomasVisita, as: 'otrosSintomas', required: false }
            ]
        });

        if (visitas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron visitas domiciliarias para este paciente'
            });
        }

        // Transformar PHQ9 de propiedades individuales a array
        const transformarPhq9Respuesta = (phq9Data) => {
            if (!phq9Data) return null;

            // Crear array de respuestas a partir de las columnas pregunta_1 a pregunta_9
            const respuestas = [];
            for (let i = 1; i <= 9; i++) {
                const pregunta = phq9Data[`pregunta_${i}`];
                respuestas.push(pregunta !== null ? pregunta.toString() : null);
            }

            return {
                respuestas,
                dificultad: phq9Data.dificultad ? phq9Data.dificultad.toString() : null,
                puntaje_phq9: phq9Data.puntaje_phq9 || null
            };
        };

        // Transformar los datos de las visitas
        const visitasTransformadas = visitas.map(visita => {
            const visitaJson = visita.toJSON();

            // Transformar PHQ9 si existe
            if (visitaJson.phq9) {
                visitaJson.phq9 = transformarPhq9Respuesta(visitaJson.phq9);
            }

            return visitaJson;
        });

        res.status(200).json({
            success: true,
            data: visitasTransformadas
        });
    } catch (error) {
        console.error('Error al obtener visitas domiciliarias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener visitas domiciliarias',
            error: error.message
        });
    }
};

// Actualizar un paciente de dependencia
export const updatePacienteDependencia = async (req, res) => {
    const { id } = req.params; // Obtener el ID del paciente de los parámetros de la solicitud
    const t = await sequelize.transaction();

    try {
        const {
            fecha_ingreso,
            nombre_paciente,
            apellido_paciente,
            rut_paciente,
            edad_paciente,
            fecha_nacimiento_paciente,
            diagnosticos, // Array de IDs de diagnósticos
            otroDiagnostico, // Campo para otro diagnóstico
            indice_barthel,
            grado_dependencia,
            causa_dependencia_tiempo,
            escolaridad_id,
            estado_civil,
            direccion_paciente,
            convivencia,
            posee_carne_discapacidad,
            recibe_pension_subsidio_jubilacion,
            tipo_beneficio,
            nombre_cuidador,
            rut_cuidador,
            edad_cuidador,
            fecha_nacimiento_cuidador,
            direccion_cuidador,
            ocupacion_cuidador,
            parentesco_cuidador,
            cuidador_recibe_estipendio,
            puntaje_escala_zarit,
            nivel_sobrecarga_zarit,
            control_cesfam_dependencia,
            consulta_servicio_urgencia,
            tipo_familia_id,
            otro_tipo_familia,
            ciclo_vital_familiar_id,
            factores_riesgo_familiar,
            telefono_1,
            telefono_2,
            horario_llamada,
            conectividad,
            estudiante_id,
            usuario_id,
            institucion_id
        } = req.body;

        // Buscar el paciente por ID
        const paciente = await PacienteDependencia.findByPk(id);
        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        // Procesar diagnósticos
        let diagnostico_ids = [];
        if (diagnosticos && Array.isArray(diagnosticos) && diagnosticos.length > 0) {
            diagnostico_ids = diagnosticos.filter(id => id != null && id !== '');
        }

        // Actualizar el paciente
        await paciente.update({
            fecha_ingreso,
            nombre_paciente,
            apellido_paciente,
            rut_paciente,
            edad_paciente,
            fecha_nacimiento_paciente,
            diagnostico_id: diagnostico_ids.length > 0 ? diagnostico_ids.join(',') : null,
            otro_diagnostico: otroDiagnostico || null,
            indice_barthel,
            grado_dependencia,
            causa_dependencia_tiempo,
            escolaridad_id,
            estado_civil,
            direccion_paciente,
            convivencia,
            posee_carne_discapacidad,
            recibe_pension_subsidio_jubilacion,
            tipo_beneficio,
            nombre_cuidador,
            rut_cuidador,
            edad_cuidador,
            fecha_nacimiento_cuidador,
            direccion_cuidador,
            ocupacion_cuidador,
            parentesco_cuidador,
            cuidador_recibe_estipendio,
            puntaje_escala_zarit,
            nivel_sobrecarga_zarit,
            control_cesfam_dependencia,
            consulta_servicio_urgencia,
            tipo_familia_id,
            otro_tipo_familia,
            ciclo_vital_familiar_id,
            factores_riesgo_familiar,
            telefono_1,
            telefono_2,
            horario_llamada,
            conectividad,
            estudiante_id,
            usuario_id,
            institucion_id
        }, { transaction: t });

        await t.commit();

        res.status(200).json({
            success: true,
            message: 'Paciente actualizado exitosamente',
            data: paciente
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar paciente',
            error: error.message
        });
    }
};

// Crear un nuevo paciente con dependencia
export const createPacienteDependencia = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            fecha_ingreso,
            nombre_paciente,
            apellido_paciente,
            rut_paciente,
            edad_paciente,
            fecha_nacimiento_paciente,
            diagnostico_ids,
            otro_diagnostico,
            indice_barthel,
            grado_dependencia,
            causa_dependencia_tiempo,
            escolaridad_id,
            estado_civil,
            direccion_paciente,
            convivencia,
            posee_carne_discapacidad,
            recibe_pension_subsidio_jubilacion,
            tipo_beneficio,
            nombre_cuidador,
            rut_cuidador,
            edad_cuidador,
            fecha_nacimiento_cuidador,
            direccion_cuidador,
            ocupacion_cuidador,
            parentesco_cuidador,
            cuidador_recibe_estipendio,
            puntaje_escala_zarit,
            nivel_sobrecarga_zarit,
            control_cesfam_dependencia,
            consulta_servicio_urgencia,
            tipo_familia_id,
            otro_tipo_familia,
            ciclo_vital_familiar_id,
            factores_riesgo_familiar,
            telefono_1,
            telefono_2,
            horario_llamada,
            conectividad,
            estudiante_id,
            usuario_id,
            institucion_id
        } = req.body;

        const nuevoPaciente = await PacienteDependencia.create({
            fecha_ingreso,
            nombre_paciente,
            apellido_paciente,
            rut_paciente,
            edad_paciente,
            fecha_nacimiento_paciente,
            diagnostico_id: diagnostico_ids.length > 0 ? diagnostico_ids.join(',') : null,
            otro_diagnostico,
            indice_barthel,
            grado_dependencia,
            causa_dependencia_tiempo,
            escolaridad_id,
            estado_civil,
            direccion_paciente,
            convivencia,
            posee_carne_discapacidad,
            recibe_pension_subsidio_jubilacion,
            tipo_beneficio,
            nombre_cuidador,
            rut_cuidador,
            edad_cuidador,
            fecha_nacimiento_cuidador,
            direccion_cuidador,
            ocupacion_cuidador,
            parentesco_cuidador,
            cuidador_recibe_estipendio,
            puntaje_escala_zarit,
            nivel_sobrecarga_zarit,
            control_cesfam_dependencia,
            consulta_servicio_urgencia,
            tipo_familia_id,
            otro_tipo_familia,
            ciclo_vital_familiar_id,
            factores_riesgo_familiar,
            telefono_1,
            telefono_2,
            horario_llamada,
            conectividad,
            estudiante_id,
            usuario_id,
            institucion_id
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            success: true,
            message: 'Paciente creado exitosamente',
            data: nuevoPaciente
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al crear paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear paciente',
            error: error.message
        });
    }
};

// Funciones auxiliares (mover al principio del archivo o importar desde un módulo común)
const tieneContenidoSignificativo = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    
    return Object.values(obj).some(value => {
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value)) return value.some(item => item !== null && item !== undefined && item !== '');
        if (typeof value === 'object') return tieneContenidoSignificativo(value);
        return true;
    });
};

const tienePhq9Significativo = (phq9) => {
    if (!phq9) return false;
    
    // Verificar si hay respuestas válidas
    const tieneRespuestas = phq9.respuestas && phq9.respuestas.some(resp => 
        resp !== null && resp !== undefined && resp !== ''
    );
    
    // Verificar otros campos
    const tieneOtrosCampos = phq9.dificultad || phq9.puntaje_phq9;
    
    return tieneRespuestas || tieneOtrosCampos;
};

const tieneYesavageSignificativo = (yesavage) => {
    if (!yesavage) return false;
    
    // Verificar si hay respuestas válidas
    const tieneRespuestas = yesavage.respuestas && yesavage.respuestas.some(resp => 
        resp !== null && resp !== undefined && resp !== ''
    );
    
    // Verificar puntaje
    const tienePuntaje = yesavage.puntaje_yesavage !== null && yesavage.puntaje_yesavage !== undefined;
    
    return tieneRespuestas || tienePuntaje;
};

const tieneSintomasSignificativo = (sintomas) => {
    if (!sintomas) return false;
    
    // Verificar campos principales
    const camposPrincipales = [
        'caida', 'relato_caida', 'dolor_cuerpo', 'lugar_dolor', 'intensidad_dolor',
        'intervencion_dolor', 'lesion_presion', 'ubicacion_lpp', 'clasificacion_lpp',
        'personal_curaciones', 'frecuencia_curaciones', 'puntaje_norton',
        'hipoglicemia', 'intervencion_hipoglicemia', 'hiperglicemia', 'intervencion_hiperglicemia',
        'crisis_hipertensiva', 'es_diabetico', 'es_hipertenso', 'edad',
        'efectos_secundarios', 'intervencion_efectos_secundarios', 'descripcion_intervencion_efectos_secundarios'
    ];
    
    const tieneCamposPrincipales = camposPrincipales.some(campo => {
        const valor = sintomas[campo];
        return valor !== null && valor !== undefined && valor !== '';
    });
    
    // Verificar norton_detalle
    const tieneNorton = sintomas.norton_detalle && Object.values(sintomas.norton_detalle).some(valor => 
        valor !== null && valor !== undefined && valor !== ''
    );
    
    // Verificar sintomas_crisis
    const tieneCrisis = sintomas.sintomas_crisis && Object.values(sintomas.sintomas_crisis).some(valor => 
        valor !== null && valor !== undefined && valor !== ''
    );
    
    return tieneCamposPrincipales || tieneNorton || tieneCrisis;
};

// Función para transformar datos de síntomas (Norton)
const transformarSintomas = (sintomas) => {
    if (!sintomas) return null;

    const { norton_detalle, ...restoSintomas } = sintomas;

    // Si existe norton_detalle, extraer los campos individuales
    if (norton_detalle) {
        return {
            ...restoSintomas,
            estado_fisico: norton_detalle.estadoFisico || null,
            estado_mental: norton_detalle.estadoMental || null,
            actividad: norton_detalle.actividad || null,
            movilidad: norton_detalle.movilidad || null,
            incontinencia: norton_detalle.incontinencia || null
        };
    }

    return sintomas;
};

// Transformar PHQ9 de array a propiedades individuales
const transformarPhq9 = (phq9) => {
    if (!phq9 || !phq9.respuestas) return null;

    const phq9Transformado = {
        dificultad: phq9.dificultad || null,
        puntaje_phq9: phq9.puntaje_phq9 || null
    };

    // Mapear cada respuesta del array a su columna correspondiente
    phq9.respuestas.forEach((respuesta, index) => {
        const numeroPregunta = index + 1;
        phq9Transformado[`pregunta_${numeroPregunta}`] = respuesta ? parseInt(respuesta) : null;
    });

    return phq9Transformado;
};

export const createVisitaDomiciliaria = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            paciente_dependencia_id,
            fecha,
            tipo_paciente,
            usuario_id,
            institucion_id,
            estudiante_id,
            sintomas,
            adherencia,
            nutricion,
            actividad,
            eliminacion,
            phq9,
            yesavage,
            otrosSintomas
        } = req.body;

        // Crear la visita domiciliaria
        const nuevaVisita = await VisitaDomiciliaria.create({
            paciente_dependencia_id,
            fecha,
            tipo_paciente,
            usuario_id,
            institucion_id,
            estudiante_id
        }, { transaction: t });

        // 1. SÍNTOMAS - Solo crear si tiene contenido significativo
        if (tieneSintomasSignificativo(sintomas)) {
            const sintomasTransformados = transformarSintomas(sintomas);
            await SintomasVisita.create({
                visita_id: nuevaVisita.id,
                ...sintomasTransformados
            }, { transaction: t });
        }

        // 2. ADHERENCIA
        if (tieneContenidoSignificativo(adherencia)) {
            await AdherenciaVisita.create({
                visita_id: nuevaVisita.id,
                ...adherencia
            }, { transaction: t });
        }

        // 3. NUTRICIÓN
        if (tieneContenidoSignificativo(nutricion)) {
            await NutricionVisita.create({
                visita_id: nuevaVisita.id,
                ...nutricion
            }, { transaction: t });
        }

        // 4. ACTIVIDAD
        if (tieneContenidoSignificativo(actividad)) {
            await ActividadVisita.create({
                visita_id: nuevaVisita.id,
                ...actividad
            }, { transaction: t });
        }

        // 5. ELIMINACIÓN
        if (tieneContenidoSignificativo(eliminacion)) {
            await EliminacionVisita.create({
                visita_id: nuevaVisita.id,
                ...eliminacion
            }, { transaction: t });
        }

        // 6. PHQ-9 - Usar validación específica
        if (tienePhq9Significativo(phq9)) {
            const phq9Transformado = transformarPhq9(phq9);
            if (phq9Transformado) {
                await Phq9Visita.create({
                    visita_id: nuevaVisita.id,
                    ...phq9Transformado
                }, { transaction: t });
            }
        }

        // 7. YESAVAGE - Usar validación específica
        if (tieneYesavageSignificativo(yesavage)) {
            await YesavageVisita.create({
                visita_id: nuevaVisita.id,
                ...yesavage
            }, { transaction: t });
        }

        // 8. OTROS SÍNTOMAS
        if (tieneContenidoSignificativo(otrosSintomas)) {
            await OtrosSintomasVisita.create({
                visita_id: nuevaVisita.id,
                ...otrosSintomas
            }, { transaction: t });
        }

        await t.commit();

        res.status(201).json({
            success: true,
            message: 'Visita domiciliaria creada exitosamente',
            data: nuevaVisita
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al crear visita domiciliaria:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear visita domiciliaria',
            error: error.message
        });
    }
};

export const updateVisitaDomiciliaria = async (req, res) => {
    const { paciente_dependencia_id } = req.params;
    const t = await sequelize.transaction();

    try {
        if (!paciente_dependencia_id) {
            return res.status(400).json({
                success: false,
                message: 'ID del paciente dependencia es requerido'
            });
        }

        const {
            fecha,
            tipo_paciente,
            usuario_id,
            institucion_id,
            estudiante_id,
            sintomas,
            adherencia,
            nutricion,
            actividad,
            eliminacion,
            phq9,
            yesavage,
            otrosSintomas
        } = req.body;

        // Buscar si existe una visita domiciliaria para este paciente
        let visita = await VisitaDomiciliaria.findOne({
            where: { paciente_dependencia_id: parseInt(paciente_dependencia_id) }
        });

        let isCreating = false;

        if (!visita) {
            isCreating = true;
            visita = await VisitaDomiciliaria.create({
                paciente_dependencia_id: parseInt(paciente_dependencia_id),
                fecha,
                tipo_paciente,
                usuario_id,
                institucion_id,
                estudiante_id
            }, { transaction: t });
        } else {
            await visita.update({
                fecha,
                tipo_paciente,
                usuario_id,
                institucion_id,
                estudiante_id
            }, { transaction: t });
        }

        const visitaId = visita.id;

        // LÓGICA CONDICIONAL PARA CADA SECCIÓN

        // 1. SÍNTOMAS - Solo crear/actualizar si tiene contenido significativo
        if (tieneSintomasSignificativo(sintomas)) {
            const sintomasTransformados = transformarSintomas(sintomas);

            if (isCreating) {
                await SintomasVisita.create({
                    visita_id: visitaId,
                    ...sintomasTransformados
                }, { transaction: t });
            } else {
                // Para actualizaciones, verificar si ya existe el registro
                const sintomasExistente = await SintomasVisita.findOne({
                    where: { visita_id: visitaId }
                });

                if (sintomasExistente) {
                    await SintomasVisita.update(sintomasTransformados, {
                        where: { visita_id: visitaId },
                        transaction: t
                    });
                } else {
                    await SintomasVisita.create({
                        visita_id: visitaId,
                        ...sintomasTransformados
                    }, { transaction: t });
                }
            }
        }

        // 2. ADHERENCIA
        if (tieneContenidoSignificativo(adherencia)) {
            if (isCreating) {
                await AdherenciaVisita.create({
                    visita_id: visitaId,
                    ...adherencia
                }, { transaction: t });
            } else {
                const adherenciaExistente = await AdherenciaVisita.findOne({
                    where: { visita_id: visitaId }
                });

                if (adherenciaExistente) {
                    await AdherenciaVisita.update(adherencia, {
                        where: { visita_id: visitaId },
                        transaction: t
                    });
                } else {
                    await AdherenciaVisita.create({
                        visita_id: visitaId,
                        ...adherencia
                    }, { transaction: t });
                }
            }
        }

        // 3. NUTRICIÓN
        if (tieneContenidoSignificativo(nutricion)) {
            if (isCreating) {
                await NutricionVisita.create({
                    visita_id: visitaId,
                    ...nutricion
                }, { transaction: t });
            } else {
                const nutricionExistente = await NutricionVisita.findOne({
                    where: { visita_id: visitaId }
                });

                if (nutricionExistente) {
                    await NutricionVisita.update(nutricion, {
                        where: { visita_id: visitaId },
                        transaction: t
                    });
                } else {
                    await NutricionVisita.create({
                        visita_id: visitaId,
                        ...nutricion
                    }, { transaction: t });
                }
            }
        }

        // 4. ACTIVIDAD
        if (tieneContenidoSignificativo(actividad)) {
            if (isCreating) {
                await ActividadVisita.create({
                    visita_id: visitaId,
                    ...actividad
                }, { transaction: t });
            } else {
                const actividadExistente = await ActividadVisita.findOne({
                    where: { visita_id: visitaId }
                });

                if (actividadExistente) {
                    await ActividadVisita.update(actividad, {
                        where: { visita_id: visitaId },
                        transaction: t
                    });
                } else {
                    await ActividadVisita.create({
                        visita_id: visitaId,
                        ...actividad
                    }, { transaction: t });
                }
            }
        }

        // 5. ELIMINACIÓN
        if (tieneContenidoSignificativo(eliminacion)) {
            if (isCreating) {
                await EliminacionVisita.create({
                    visita_id: visitaId,
                    ...eliminacion
                }, { transaction: t });
            } else {
                const eliminacionExistente = await EliminacionVisita.findOne({
                    where: { visita_id: visitaId }
                });

                if (eliminacionExistente) {
                    await EliminacionVisita.update(eliminacion, {
                        where: { visita_id: visitaId },
                        transaction: t
                    });
                } else {
                    await EliminacionVisita.create({
                        visita_id: visitaId,
                        ...eliminacion
                    }, { transaction: t });
                }
            }
        }

        // 6. PHQ-9
        if (tienePhq9Significativo(phq9)) {
            const phq9Transformado = transformarPhq9(phq9);
            if (phq9Transformado) {
                if (isCreating) {
                    await Phq9Visita.create({
                        visita_id: visitaId,
                        ...phq9Transformado
                    }, { transaction: t });
                } else {
                    const phq9Existente = await Phq9Visita.findOne({
                        where: { visita_id: visitaId }
                    });

                    if (phq9Existente) {
                        await Phq9Visita.update(phq9Transformado, {
                            where: { visita_id: visitaId },
                            transaction: t
                        });
                    } else {
                        await Phq9Visita.create({
                            visita_id: visitaId,
                            ...phq9Transformado
                        }, { transaction: t });
                    }
                }
            }
        }

        // 7. YESAVAGE
        if (tieneYesavageSignificativo(yesavage)) {
            if (isCreating) {
                await YesavageVisita.create({
                    visita_id: visitaId,
                    ...yesavage
                }, { transaction: t });
            } else {
                const yesavageExistente = await YesavageVisita.findOne({
                    where: { visita_id: visitaId }
                });

                if (yesavageExistente) {
                    await YesavageVisita.update(yesavage, {
                        where: { visita_id: visitaId },
                        transaction: t
                    });
                } else {
                    await YesavageVisita.create({
                        visita_id: visitaId,
                        ...yesavage
                    }, { transaction: t });
                }
            }
        }

        // 8. OTROS SÍNTOMAS
        if (tieneContenidoSignificativo(otrosSintomas)) {
            if (isCreating) {
                await OtrosSintomasVisita.create({
                    visita_id: visitaId,
                    ...otrosSintomas
                }, { transaction: t });
            } else {
                const otrosSintomasExistente = await OtrosSintomasVisita.findOne({
                    where: { visita_id: visitaId }
                });

                if (otrosSintomasExistente) {
                    await OtrosSintomasVisita.update(otrosSintomas, {
                        where: { visita_id: visitaId },
                        transaction: t
                    });
                } else {
                    await OtrosSintomasVisita.create({
                        visita_id: visitaId,
                        ...otrosSintomas
                    }, { transaction: t });
                }
            }
        }

        await t.commit();

        res.status(200).json({
            success: true,
            message: isCreating ? 'Visita domiciliaria creada exitosamente' : 'Visita domiciliaria actualizada exitosamente',
            data: visita,
            created: isCreating
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al procesar visita domiciliaria:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar visita domiciliaria',
            error: error.message
        });
    }
};

//Seguimiento Paciente Dependencia
// Crear un nuevo seguimiento
export const createSeguimientoDependencia = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            paciente_id,
            numero_llamado,
            fecha_contacto,
            diagnostico,
            grado_dependencia,
            areas_reforzadas,
            indicaciones_educacion,
            observaciones,
            estudiante_id,
            usuario_id
        } = req.body;

        // Verificar que el paciente existe
        const paciente = await PacienteDependencia.findByPk(paciente_id);
        if (!paciente) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        // Verificar que no exista ya un seguimiento con el mismo número para este paciente
        const seguimientoExistente = await SeguimientoDependencia.findOne({
            where: {
                paciente_id,
                numero_llamado
            }
        });

        if (seguimientoExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe un seguimiento número ${numero_llamado} para este paciente`
            });
        }

        // Crear el seguimiento
        const seguimiento = await SeguimientoDependencia.create({
            paciente_id,
            numero_llamado,
            fecha_contacto,
            diagnostico: Array.isArray(diagnostico) ? diagnostico.join(', ') : diagnostico,
            grado_dependencia,
            areas_reforzadas,
            indicaciones_educacion,
            observaciones,
            estudiante_id,
            usuario_id
        }, { transaction: t });

        await t.commit();

        // Obtener el seguimiento creado con sus relaciones
        const seguimientoCompleto = await SeguimientoDependencia.findByPk(seguimiento.id, {
            include: [
                {
                    model: PacienteDependencia,
                    as: 'paciente_dependencia'
                },
                {
                    model: Estudiante,
                    as: 'estudiante'
                },
                {
                    model: Usuario,
                    as: 'usuario'
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Seguimiento creado exitosamente',
            data: seguimientoCompleto
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al crear seguimiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear seguimiento',
            error: error.message
        });
    }
};

// Obtener todos los seguimientos de un paciente específico
export const getSeguimientosByPaciente = async (req, res) => {
    try {
        const { paciente_id } = req.params;

        const seguimientos = await SeguimientoDependencia.findAll({
            where: { paciente_id },
            include: [
                {
                    model: PacienteDependencia,
                    as: 'paciente_dependencia',
                    attributes: ['id', 'nombre_paciente', 'apellido_paciente', 'rut_paciente']
                },
                {
                    model: Estudiante,
                    as: 'estudiante',
                    attributes: ['id', 'nombres', 'apellidos']
                },
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombres', 'apellidos']
                }
            ],
            order: [['numero_llamado', 'ASC'], ['fecha_contacto', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: seguimientos,
            total: seguimientos.length
        });
    } catch (error) {
        console.error('Error al obtener seguimientos del paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener seguimientos del paciente',
            error: error.message
        });
    }
};

// Actualizar un seguimiento
export const updateSeguimientoDependencia = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction();

    try {
        const {
            fecha_contacto,
            diagnostico,
            grado_dependencia,
            areas_reforzadas,
            indicaciones_educacion,
            observaciones,
            estudiante_id,
            usuario_id
        } = req.body;

        // Buscar el seguimiento por ID
        const seguimiento = await SeguimientoDependencia.findByPk(id);
        if (!seguimiento) {
            return res.status(404).json({
                success: false,
                message: 'Seguimiento no encontrado'
            });
        }

        // Actualizar el seguimiento
        await seguimiento.update({
            fecha_contacto,
            diagnostico: Array.isArray(diagnostico) ? diagnostico.join(', ') : diagnostico,
            grado_dependencia,
            areas_reforzadas,
            indicaciones_educacion,
            observaciones,
            estudiante_id,
            usuario_id
        }, { transaction: t });

        await t.commit();

        // Obtener el seguimiento actualizado con sus relaciones
        const seguimientoActualizado = await SeguimientoDependencia.findByPk(id, {
            include: [
                {
                    model: PacienteDependencia,
                    as: 'paciente_dependencia'
                },
                {
                    model: Estudiante,
                    as: 'estudiante'
                },
                {
                    model: Usuario,
                    as: 'usuario'
                }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Seguimiento actualizado exitosamente',
            data: seguimientoActualizado
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al actualizar seguimiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar seguimiento',
            error: error.message
        });
    }
};

// Eliminar un seguimiento
export const deleteSeguimientoDependencia = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction();

    try {
        const seguimiento = await SeguimientoDependencia.findByPk(id);
        if (!seguimiento) {
            return res.status(404).json({
                success: false,
                message: 'Seguimiento no encontrado'
            });
        }

        await seguimiento.destroy({ transaction: t });
        await t.commit();

        res.status(200).json({
            success: true,
            message: 'Seguimiento eliminado exitosamente'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al eliminar seguimiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar seguimiento',
            error: error.message
        });
    }
};