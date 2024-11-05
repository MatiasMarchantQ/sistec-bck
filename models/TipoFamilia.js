// src/models/TipoFamilia.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class TipoFamilia extends Model {}

TipoFamilia.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'TipoFamilia',
  tableName: 'tipos_familia',
  timestamps: false
});

export default TipoFamilia;