// src/models/VisitaDomiciliaria.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class VisitaDomiciliaria extends Model {}

VisitaDomiciliaria.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    paciente_dependencia_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    tipo_paciente: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    institucion_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    estudiante_id: {
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
    modelName: 'VisitaDomiciliaria',
    tableName: 'visitas_domiciliarias',
    timestamps: true
});

export default VisitaDomiciliaria;
