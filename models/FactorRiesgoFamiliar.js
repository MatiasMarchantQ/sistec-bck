// src/models/FactorRiesgoFamiliar.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import FichaClinicaInfantil from './FichaClinicaInfantil.js';

class FactorRiesgoFamiliar extends Model {}

FactorRiesgoFamiliar.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ficha_clinica_id: {
    type: DataTypes.INTEGER,
    references: {
      model: FichaClinicaInfantil,
      key: 'id'
    },
    allowNull: false
  },
  migrantes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bajos_recursos: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  adicciones: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  depresion_materna: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  otras: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'FactorRiesgoFamiliar',
  tableName: 'factores_riesgo_familiar',
  timestamps: false
});

FactorRiesgoFamiliar.belongsTo(FichaClinicaInfantil, { foreignKey: 'ficha_clinica_id' });

export default FactorRiesgoFamiliar;