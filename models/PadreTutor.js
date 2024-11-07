// models/PadreTutor.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import FichaClinicaInfantil from './FichaClinicaInfantil.js';
import NivelEscolaridad from './NivelEscolaridad.js';

const PadreTutor = sequelize.define('PadreTutor', {
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
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  escolaridad_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: NivelEscolaridad,
      key: 'id'
    }
  },
  ocupacion: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'padres_tutores',
  timestamps: true,
  underscored: true
});

// Asociaciones
PadreTutor.belongsTo(FichaClinicaInfantil, { foreignKey: 'ficha_clinica_id' });
PadreTutor.belongsTo(NivelEscolaridad, { 
  foreignKey: 'escolaridad_id',
  as: 'nivelEscolaridad' 
});

export default PadreTutor;