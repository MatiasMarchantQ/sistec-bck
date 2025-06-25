// src/models/OtrosSintomasVisita.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class OtrosSintomasVisita extends Model {}

OtrosSintomasVisita.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visita_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    otros_sintomas: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    manejo_sintomas: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    comentarios: {
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
    modelName: 'OtrosSintomasVisita',
    tableName: 'otros_sintomas_visita',
    timestamps: true
});

export default OtrosSintomasVisita;
