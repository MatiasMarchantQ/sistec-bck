import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import FichaClinicaInfantil from './FichaClinicaInfantil.js';
import FactorRiesgoFamiliar from './FactorRiesgoFamiliar.js';

const FichaFactorRiesgoFamiliar = sequelize.define('FichaFactorRiesgoFamiliar', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ficha_clinica_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: FichaClinicaInfantil,
      key: 'id'
    }
  },
  factor_riesgo_familiar_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: FactorRiesgoFamiliar,
      key: 'id'
    }
  }
}, {
  tableName: 'ficha_factor_riesgo_familiar',
  timestamps: true
});

// Definir las relaciones
FichaClinicaInfantil.belongsToMany(FactorRiesgoFamiliar, {
  through: FichaFactorRiesgoFamiliar,
  foreignKey: 'ficha_clinica_id', otherKey: 'factor_riesgo_familiar_id',
  as: 'factoresRiesgoFamiliar'
});

FactorRiesgoFamiliar.belongsToMany(FichaClinicaInfantil, {
  through: FichaFactorRiesgoFamiliar,
  foreignKey: 'factor_riesgo_familiar_id',
  otherKey: 'ficha_clinica_id'
});

export default FichaFactorRiesgoFamiliar;