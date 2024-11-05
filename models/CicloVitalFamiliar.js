// src/models/CicloVitalFamiliar.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class CicloVitalFamiliar extends Model {}

CicloVitalFamiliar.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ciclo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'CicloVitalFamiliar',
  tableName: 'ciclos_vitales_familiares',
  timestamps: false
});

export default CicloVitalFamiliar;