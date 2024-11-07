// src/models/PacienteAdulto.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';

class PacienteAdulto extends Model {}

PacienteAdulto.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombres: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  rut: {
    type: DataTypes.STRING(12),
    allowNull: false,
    unique: true
  },
  edad: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  telefono_principal: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  telefono_secundario: {
    type: DataTypes.STRING(15),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'PacienteAdulto',
  tableName: 'pacientes_adultos',
  timestamps: true
});

export default PacienteAdulto;