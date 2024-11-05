// src/models/Institucion.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class Institucion extends Model {}

Institucion.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  tipo_id: {
    type: DataTypes.INTEGER
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Institucion',
  tableName: 'instituciones',
  timestamps: false
});

export default Institucion;