// models/SeguimientoAdulto.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import PacienteAdulto from './PacienteAdulto.js';

class SeguimientoAdulto extends Model {}

SeguimientoAdulto.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: PacienteAdulto,
      key: 'id'
    }
  },
  numero_llamado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 3
    }
  },
  es_llamado_final: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si este es un llamado adicional después del tercer llamado'
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  riesgo_infeccion: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  riesgo_glicemia: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  riesgo_hipertension: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  adherencia: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  adherencia_tratamiento: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  efectos_secundarios: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  nutricion: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  actividad_fisica: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  eliminacion: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  sintomas_depresivos: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  autoeficacia: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  otros_sintomas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  manejo_sintomas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  comentarios: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'SeguimientoAdulto',
  tableName: 'seguimientos_adultos',
  timestamps: true,
  indexes: [
    {
      unique: false,
      fields: ['paciente_id', 'numero_llamado']
    }
  ]
});

// Asociaciones
SeguimientoAdulto.belongsTo(PacienteAdulto, { 
  foreignKey: 'paciente_id', 
  as: 'paciente_adulto' 
});

PacienteAdulto.hasMany(SeguimientoAdulto, { 
  foreignKey: 'paciente_id', 
  as: 'seguimientos_adulto' 
});

export default SeguimientoAdulto;