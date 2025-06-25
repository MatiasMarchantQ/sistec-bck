// src/models/ActividadVisita.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class ActividadVisita extends Model {}

ActividadVisita.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visita_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    movilidad: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    tipo_cama: {
        type: DataTypes.ENUM('comun', 'catreClinico'),
        allowNull: true
    },
    altura_cama: {
        type: DataTypes.ENUM('adecuada', 'noAdecuada'),
        allowNull: true
    },
    colchon_antiescara: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    ejercicios_kinesiologo: {
        type: DataTypes.ENUM('si', 'no'),
        allowNull: true
    },
    ejercicio_especifico: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    frecuencia_ejercicio: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    dificultad_dormir: {
        type: DataTypes.ENUM('si', 'no'),
        allowNull: true
    },
    explicacion_dificultad_dormir: {
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
    modelName: 'ActividadVisita',
    tableName: 'actividad_visita',
    timestamps: true
});

export default ActividadVisita;
