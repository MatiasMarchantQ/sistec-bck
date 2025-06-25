// src/models/PacienteDependencia.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class PacienteDependencia extends Model { }

PacienteDependencia.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha_ingreso: {
        type: DataTypes.DATE,
        allowNull: false
    },
    nombre_paciente: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    apellido_paciente:{
        type: DataTypes.STRING(100),
        allowNull: false
    },
    rut_paciente: {
        type: DataTypes.STRING(12),
        allowNull: false,
        unique: true
    },
    edad_paciente: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha_nacimiento_paciente: {
        type: DataTypes.DATE,
        allowNull: false
    },
    diagnostico_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    otro_diagnostico: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    indice_barthel: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    grado_dependencia: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    causa_dependencia_tiempo: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    escolaridad_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    estado_civil: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    direccion_paciente: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    convivencia: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    posee_carne_discapacidad: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    recibe_pension_subsidio_jubilacion: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    tipo_beneficio: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    nombre_cuidador: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    rut_cuidador: {
        type: DataTypes.STRING(12),
        allowNull: true
    },
    edad_cuidador: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fecha_nacimiento_cuidador: {
        type: DataTypes.DATE,
        allowNull: true
    },
    direccion_cuidador: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    ocupacion_cuidador: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    parentesco_cuidador: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    cuidador_recibe_estipendio: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    puntaje_escala_zarit: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    nivel_sobrecarga_zarit: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    control_cesfam_dependencia: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    consulta_servicio_urgencia: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tipo_familia_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    otro_tipo_familia: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    ciclo_vital_familiar_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    factores_riesgo_familiar: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    telefono_1: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    telefono_2: {
        type: DataTypes.STRING(15),
        allowNull: true
    },
    horario_llamada: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    conectividad: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    estudiante_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    institucion_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'PacienteDependencia',
    tableName: 'pacientes_dependencia',
    timestamps: true
});

export default PacienteDependencia;
