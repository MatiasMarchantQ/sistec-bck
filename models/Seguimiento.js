// src/models/Seguimiento.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import FichaClinicaInfantil from './FichaClinicaInfantil.js';
import Estudiante from './Estudiante.js';

class Seguimiento extends Model {}

Seguimiento.init({
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
  fecha_llamada: {
    type: DataTypes.DATE,
    allowNull: false
  },
  estudiante_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Estudiante,
      key: 'id'
    },
    allowNull: false
  },
  protocolo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  numero_llamada: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Seguimiento',
  tableName: 'seguimientos',
  timestamps: false
});

Seguimiento.belongsTo(FichaClinicaInfantil, { foreignKey: 'ficha_clinica_id' });
Seguimiento.belongsTo(Estudiante, { foreignKey: 'estudiante_id' });

export default Seguimiento;