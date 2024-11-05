// src/models/FichaClinicaAdulto.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import PacienteAdulto from './PacienteAdulto.js';
import Estudiante from './Estudiante.js';
import Institucion from './Institucion.js';

class FichaClinicaAdulto extends Model {}

FichaClinicaAdulto.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    references: {
      model: PacienteAdulto,
      key: 'id'
    },
    allowNull: false
  },
  fecha_evaluacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  tipo_evaluacion: {
    type: DataTypes.ENUM('INICIAL', 'REEVALUACION'),
    allowNull: false
  },
  diagnostico: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  tratamiento: {
    type: DataTypes.STRING(200),
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
  institucion_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Institucion,
      key: 'id'
    },
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'FichaClinicaAdulto',
  tableName: 'fichas_clinicas_adultos',
  timestamps: false
});

FichaClinicaAdulto.belongsTo(PacienteAdulto, { foreignKey: 'paciente_id' });
FichaClinicaAdulto.belongsTo(Estudiante, { foreignKey: 'estudiante_id' });
FichaClinicaAdulto.belongsTo(Institucion, { foreignKey: 'institucion_id' });

export default FichaClinicaAdulto;