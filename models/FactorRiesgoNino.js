// src/models/FactorRiesgoNino.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import FichaClinicaInfantil from './FichaClinicaInfantil.js';

class FactorRiesgoNino extends Model {}

FactorRiesgoNino.init({
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
  prematurez: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  desnutricion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  enfermedades_cronicas: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  neurodivergencia: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'FactorRiesgoNino',
  tableName: 'factores_riesgo_nino',
  timestamps: false
});

FactorRiesgoNino.belongsTo(FichaClinicaInfantil, { foreignKey: 'ficha_clinica_id' });

export default FactorRiesgoNino;