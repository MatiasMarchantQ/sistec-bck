// src/models/AdherenciaVisita.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class AdherenciaVisita extends Model { }

AdherenciaVisita.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visita_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    olvida_medicamento: {
        type: DataTypes.ENUM('si', 'no'),
        allowNull: true
    },
    toma_hora: {
        type: DataTypes.ENUM('si', 'no'),
        allowNull: true
    },
    deja_remedio: {
        type: DataTypes.ENUM('si', 'no'),
        allowNull: true
    },
    se_siente_mal: {
        type: DataTypes.ENUM('si', 'no'),
        allowNull: true
    },
    puntaje_adherencia: {
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
    modelName: 'AdherenciaVisita',
    tableName: 'adherencia_visita',
    timestamps: true
});

export default AdherenciaVisita;
