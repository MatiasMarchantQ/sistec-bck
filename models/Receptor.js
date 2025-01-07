// src/models/Receptor.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class Receptor extends Model {}

Receptor.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cargo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  institucion_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Receptor',
  tableName: 'receptores',
  timestamps: false
});

export default Receptor;