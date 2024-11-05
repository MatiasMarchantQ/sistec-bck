// src/models/PacienteNino.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import RangoEdad from './RangoEdad.js';

class PacienteNino extends Model {}

PacienteNino.init({
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
    type: DataTypes.STRING(200),
    allowNull: false
  },
  rut: {
    type: DataTypes.STRING(12),
    allowNull: false,
    unique: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  telefono_principal: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  telefono_secundario: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  rango_edad_id: {
    type: DataTypes.INTEGER,
    references: {
      model: RangoEdad,
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'PacienteNino',
  tableName: 'pacientes_ninos',
  timestamps: false
});

PacienteNino.belongsTo(RangoEdad, { foreignKey: 'rango_edad_id' });

export default PacienteNino;