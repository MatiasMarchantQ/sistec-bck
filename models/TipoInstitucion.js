// src/models/TipoInstitucion.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class TipoInstitucion extends Model {}

TipoInstitucion.init({
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
  modelName: 'TipoInstitucion',
  tableName: 'tipos_institucion',
  timestamps: false
});

export default TipoInstitucion;