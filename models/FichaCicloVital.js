// src/models/FichaCicloVital.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class FichaCicloVital extends Model {}

FichaCicloVital.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ficha_clinica_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ciclo_vital_familiar_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_ficha: {
    type: DataTypes.ENUM('adulto', 'infantil'),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'FichaCicloVital',
  tableName: 'fichas_ciclos_vitales',
  timestamps: false
});

export default FichaCicloVital;