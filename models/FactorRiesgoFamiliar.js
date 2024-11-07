import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

const FactorRiesgoFamiliar = sequelize.define('FactorRiesgoFamiliar', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'factores_riesgo_familiar',
  timestamps: true
});

export default FactorRiesgoFamiliar;