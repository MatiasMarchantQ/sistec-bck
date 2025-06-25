// src/models/NutricionVisita.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class NutricionVisita extends Model {}

NutricionVisita.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visita_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidad_comidas: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    consumo_habitual: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    asistencia_alimentacion: {
        type: DataTypes.BOOLEAN,
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
    modelName: 'NutricionVisita',
    tableName: 'nutricion_visita',
    timestamps: true
});

export default NutricionVisita;
