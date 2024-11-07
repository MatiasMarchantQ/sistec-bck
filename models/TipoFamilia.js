// models/TipoFamilia.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class TipoFamilia extends Model {}

TipoFamilia.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
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