// src/models/YesavageVisita.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class YesavageVisita extends Model {}

YesavageVisita.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visita_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    respuestas: {
        type: DataTypes.JSON, // O puedes usar JSON si prefieres
        allowNull: true
    },
    puntaje_yesavage: {
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
    modelName: 'YesavageVisita',
    tableName: 'yesavage_visita',
    timestamps: true
});

export default YesavageVisita;
