import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

const PacienteInfantil = sequelize.define('PacienteInfantil', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombres: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rut: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  edad: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono_principal: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono_secundario: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'pacientes_infantiles',
  timestamps: true
});

export default PacienteInfantil;