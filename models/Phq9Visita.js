// src/models/Phq9Visita.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class Phq9Visita extends Model {}

Phq9Visita.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visita_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pregunta_1: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pregunta_2: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pregunta_3: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pregunta_4: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pregunta_5: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pregunta_6: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pregunta_7: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pregunta_8: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pregunta_9: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    dificultad: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    puntaje_phq9: {
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
    modelName: 'Phq9Visita',
    tableName: 'phq9_visita',
    timestamps: true
});

export default Phq9Visita;
