import PacienteAdulto from '../models/PacienteAdulto.js';
import FichaClinicaAdulto from '../models/FichaClinicaAdulto.js';
import NivelEscolaridad from '../models/NivelEscolaridad.js';
import CicloVitalFamiliar from '../models/CicloVitalFamiliar.js';
import TipoFamilia from '../models/TipoFamilia.js';
import FichaCicloVital from '../models/FichaCicloVital.js';  // Añade esta línea
import FichaTipoFamilia from '../models/FichaTipoFamilia.js';  // Añade esta línea si no está
import sequelize from '../models/index.js';

// En tu controlador de fichas clínicas
export const getFichasClinicasPorInstitucion = async (req, res) => {
    try {
        const { institucionId } = req.params;
        const { rol_id, estudiante_id } = req.user; // Asumiendo que tienes el usuario en el request

        let whereClause = { institucion_id: institucionId };

        // Si es estudiante, solo puede ver sus propias fichas
        if (rol_id === 3) { // Asumiendo que 3 es el rol de estudiante
            whereClause.estudiante_id = estudiante_id;
        }

        const fichas = await FichaClinicaAdulto.findAll({
            where: whereClause,
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
                }
            ],
            attributes: [
                'id',
                'fecha_evaluacion',
                'diagnostico',
                'ocupacion',
                'valor_hbac1',
                'alcohol_drogas',
                'tabaquismo',
                'createdAt',
                'updatedAt'
            ],
            order: [['fecha_evaluacion', 'DESC']]
        });

        // Formatear la respuesta
        const fichasFormateadas = fichas.map(ficha => ({
            id: ficha.id,
            fecha: ficha.fecha_evaluacion,
            paciente: {
                nombres: ficha.PacienteAdulto.nombres,
                apellidos: ficha.PacienteAdulto.apellidos,
                rut: ficha.PacienteAdulto.rut,
                edad: ficha.PacienteAdulto.edad
            },
            diagnostico: ficha.diagnostico,
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

        res.json({
            success: true,
            data: fichasFormateadas,
            total: fichasFormateadas.length
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
            fecha,
            nombres,
            apellidos,
            rut,
            edad,
            diagnostico,
            escolaridad,
            ocupacion,
            direccion,
            conQuienVive,
            tiposFamilia,
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
            fecha_evaluacion: fecha,
            diagnostico,
            escolaridad_id: nivelEscolaridad.id,
            ocupacion,
            direccion,
            con_quien_vive: conQuienVive,
            horario_llamada: horarioLlamada,
            conectividad,
            valor_hbac1: parseFloat(valorHbac1),
            alcohol_drogas: factoresRiesgo.alcoholDrogas,
            tabaquismo: factoresRiesgo.tabaquismo,
            estudiante_id: estudiante_id || null,
            usuario_id: usuario_id || null,
            institucion_id
        }, { transaction: t });

        // Asociar ciclos vitales familiares
        if (ciclosVitalesFamiliares && ciclosVitalesFamiliares.length > 0) {
            const ciclosVitales = await CicloVitalFamiliar.findAll({
                where: {
                    id: ciclosVitalesFamiliares // Ahora esperamos un array de IDs
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

        // Asociar tipos de familia
        if (tiposFamilia && tiposFamilia.length > 0) {
            const tiposFamiliaInstances = await TipoFamilia.findAll({
                where: {
                    id: tiposFamilia // Ahora esperamos un array de IDs
                },
                transaction: t
            });
            
            await Promise.all(tiposFamiliaInstances.map(tipo => 
                FichaTipoFamilia.create({
                    ficha_clinica_id: fichaClinica.id,
                    tipo_familia_id: tipo.id,
                    tipo_ficha: 'adulto'
                }, { transaction: t })
            ));
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

export const getFichaClinica = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Primero, intenta buscar una ficha de adulto
        let fichaClinica = await FichaClinicaAdulto.findByPk(id, {
            include: [
                {
                    model: PacienteAdulto,
                    attributes: ['id', 'nombres', 'apellidos', 'rut', 'edad', 'telefono_principal', 'telefono_secundario']
                },
                {
                    model: NivelEscolaridad,
                    attributes: ['id', 'nivel']
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
                }
            ]
        });

        let tipoFicha = 'adulto';

        // Si no se encuentra, busca una ficha infantil
        if (!fichaClinica) {
            // Aquí iría la lógica para buscar una ficha infantil
            // Por ahora, simplemente retornamos que no se encontró la ficha
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica no encontrada'
            });
            
            // Cuando implementes las fichas infantiles, descomenta y adapta este código:
            /*
            fichaClinica = await FichaClinicaInfantil.findByPk(id, {
                include: [
                    { model: PacienteInfantil, attributes: [...] },
                    // ... otros includes necesarios para fichas infantiles
                ]
            });
            tipoFicha = 'infantil';
            */
        }

        if (!fichaClinica) {
            return res.status(404).json({
                success: false,
                message: 'Ficha clínica no encontrada'
            });
        }

        // Formatear la respuesta según el tipo de ficha
        const fichaFormateada = tipoFicha === 'adulto' 
            ? formatearFichaAdulto(fichaClinica)
            : formatearFichaInfantil(fichaClinica);

        res.json({
            success: true,
            data: {
                ...fichaFormateada,
                tipoFicha
            }
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
    // Por ahora, retornamos un objeto vacío
    // Cuando implementes las fichas infantiles, adapta esta función
    return {};
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

export default {
    createFichaClinicaAdulto,
    getFichaClinica,
    updateFichaClinica
};