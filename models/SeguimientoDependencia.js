// models/SeguimientoDependencia.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import PacienteDependencia from './PacienteDependencia.js';
import Estudiante from './Estudiante.js';
import Usuario from './Usuario.js';

class SeguimientoDependencia extends Model {}

SeguimientoDependencia.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: PacienteDependencia,
      key: 'id'
    }
  },
  numero_llamado: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_contacto: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  // Campos del protocolo de llamada
  diagnostico: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  grado_dependencia: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  areas_reforzadas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  indicaciones_educacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estudiante_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Estudiante,
      key: 'id'
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuario,
      key: 'id'
    }
  },
}, {
  sequelize,
  modelName: 'SeguimientoDependencia',
  tableName: 'seguimientos_dependencia',
  timestamps: true,
  indexes: [
    {
      unique: false,
      fields: ['paciente_id', 'numero_llamado']
    },
    {
      unique: false,
      fields: ['fecha_contacto']
    }
  ]
});

// Asociaciones
SeguimientoDependencia.belongsTo(PacienteDependencia, { 
  foreignKey: 'paciente_id', 
  as: 'paciente_dependencia' 
});

PacienteDependencia.hasMany(SeguimientoDependencia, { 
  foreignKey: 'paciente_id', 
  as: 'seguimientos_dependencia' 
});

SeguimientoDependencia.belongsTo(Estudiante, { 
  foreignKey: 'estudiante_id', 
  as: 'estudiante' 
});

SeguimientoDependencia.belongsTo(Usuario, { 
  foreignKey: 'usuario_id', 
  as: 'usuario' 
});

export default SeguimientoDependencia;