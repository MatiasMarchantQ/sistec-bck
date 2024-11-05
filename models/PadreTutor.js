// src/models/PadreTutor.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import FichaClinicaInfantil from './FichaClinicaInfantil.js';
import NivelEscolaridad from './NivelEscolaridad.js';

class PadreTutor extends Model {}

PadreTutor.init({
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
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  escolaridad_id: {
    type : DataTypes.INTEGER,
    references: {
      model: NivelEscolaridad,
      key: 'id'
    }
  },
  ocupacion: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'PadreTutor',
  tableName: 'padres_tutores',
  timestamps: false
});

PadreTutor.belongsTo(FichaClinicaInfantil, { foreignKey: 'ficha_clinica_id' });
PadreTutor.belongsTo(NivelEscolaridad, { foreignKey: 'escolaridad_id' });

export default PadreTutor;