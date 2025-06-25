// src/models/SintomasVisita.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class SintomasVisita extends Model { }

SintomasVisita.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visita_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    caida: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    relato_caida: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    dolor_cuerpo: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    lugar_dolor: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    intensidad_dolor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 10
        }
    },
    intervencion_dolor: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    lesion_presion: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    ubicacion_lpp: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    clasificacion_lpp: {
        type: DataTypes.ENUM('I', 'II', 'III', 'IV'),
        allowNull: true
    },
    personal_curaciones: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    frecuencia_curaciones: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    estado_fisico: {
        type: DataTypes.STRING,
        allowNull: true
    },
    estado_mental: {
        type: DataTypes.STRING,
        allowNull: true
    },
    actividad: {
        type: DataTypes.STRING,
        allowNull: true
    },
    movilidad: {
        type: DataTypes.STRING,
        allowNull: true
    },
    incontinencia: {
        type: DataTypes.STRING,
        allowNull: true
    },
    puntaje_norton: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    hipoglicemia: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    intervencion_hipoglicemia: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    hiperglicemia: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    intervencion_hiperglicemia: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    crisis_hipertensiva: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    sintomas_crisis_dolor_pecho: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    sintomas_crisis_dolor_cabeza: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    sintomas_crisis_zumbido_oidos: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    sintomas_crisis_nauseas: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    es_diabetico: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    es_hipertenso: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    edad: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    efectos_secundarios: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    intervencion_efectos_secundarios: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    descripcion_intervencion_efectos_secundarios: {
        type: DataTypes.TEXT,
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
    modelName: 'SintomasVisita',
    tableName: 'sintomas_visita',
    timestamps: true
});

export default SintomasVisita;
