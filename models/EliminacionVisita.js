// src/models/EliminacionVisita.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class EliminacionVisita extends Model { }

EliminacionVisita.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visita_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    miccion: {
        type: DataTypes.ENUM('si', 'no'),
        allowNull: true
    },
    miccion_cual: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    orina_oscura: {
        type: DataTypes.ENUM('si', 'no'),
        allowNull: true
    },
    estreñimiento: {
        type: DataTypes.ENUM('si', 'no'),
        allowNull: true
    },
    dias_estreñimiento: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    intervencion: {
        type: DataTypes.ENUM('si', 'no'),
        allowNull: true
    },
    intervencion_cual: {
        type: DataTypes.STRING(100),
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
    modelName: 'EliminacionVisita',
    tableName: 'eliminacion_visita',
    timestamps: true
});

export default EliminacionVisita;
