// src/models/Rol.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class Rol extends Model {}

Rol.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'Rol',
  tableName: 'roles',
  timestamps: false
});

export default Rol;