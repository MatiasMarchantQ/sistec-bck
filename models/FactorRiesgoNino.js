import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

const FactorRiesgoNino = sequelize.define('FactorRiesgoNino', {
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
  tableName: 'factores_riesgo_nino',
  timestamps: true
});

export default FactorRiesgoNino;