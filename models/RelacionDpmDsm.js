// src/models/RelacionDpmDsm.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class RelacionDpmDsm extends Model {}

RelacionDpmDsm.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  puntaje_dpm: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  diagnostico_dsm: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'RelacionDpmDsm',
  tableName: 'relacion_dpm_dsm',
  timestamps: false
});

export default RelacionDpmDsm;