import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import FichaClinicaInfantil from './FichaClinicaInfantil.js';
import FactorRiesgoNino from './FactorRiesgoNino.js';

const FichaFactorRiesgoNino = sequelize.define('FichaFactorRiesgoNino', {
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
  factor_riesgo_nino_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: FactorRiesgoNino,
      key: 'id'
    }
  }
}, {
  tableName: 'ficha_factor_riesgo_nino',
  timestamps: true
});

FichaClinicaInfantil.belongsToMany(FactorRiesgoNino, {
  through: FichaFactorRiesgoNino,
  foreignKey: 'ficha_clinica_id',
  otherKey: 'factor_riesgo_nino_id',
  as: 'factoresRiesgoNinoInfantil'
});

FactorRiesgoNino.belongsToMany(FichaClinicaInfantil, {
  through: FichaFactorRiesgoNino,
  foreignKey: 'factor_riesgo_nino_id',
  otherKey: 'ficha_clinica_id',
  as: 'fichasClinicasInfantil'
});

export default FichaFactorRiesgoNino;