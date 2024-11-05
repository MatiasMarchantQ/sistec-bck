// src/models/NivelEscolaridad.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class NivelEscolaridad extends Model {}

NivelEscolaridad.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nivel: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'NivelEscolaridad',
  tableName: 'niveles_escolaridad',
  timestamps: false
});

export default NivelEscolaridad;