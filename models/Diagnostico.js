// models/Diagnostico.js
import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Diagnostico = sequelize.define('Diagnostico', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'diagnosticos',
    timestamps: false
});

export default Diagnostico;