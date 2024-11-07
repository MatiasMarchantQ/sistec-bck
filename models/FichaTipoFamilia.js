// src/models/FichaTipoFamilia.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class FichaTipoFamilia extends Model {}

FichaTipoFamilia.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ficha_clinica_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_familia_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_ficha: {
    type: DataTypes.ENUM('adulto', 'infantil'),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'FichaTipoFamilia',
  tableName: 'fichas_tipos_familia',
  timestamps: false
});

export default FichaTipoFamilia;