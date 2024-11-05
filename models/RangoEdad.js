// src/models/RangoEdad.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class RangoEdad extends Model {}

RangoEdad.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rango: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'RangoEdad',
  tableName: 'rangos_edad',
  timestamps: false
});

export default RangoEdad;