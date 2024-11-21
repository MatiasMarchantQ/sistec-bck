import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import PacienteAdulto from './PacienteAdulto.js';
import Usuario from './Usuario.js';
import Estudiante from './Estudiante.js';

const SeguimientoInfantil = sequelize.define('SeguimientoInfantil', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_llamado:{
    type: DataTypes.INTEGER,
    allowNull: false
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_paciente: {
    type: DataTypes.ENUM('infantil', 'adulto'),
    allowNull: false,
    field: 'tipo_paciente'
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  grupo_edad: {
    type: DataTypes.STRING,
    allowNull: true
  },
  area_motor_grueso: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  area_motor_fino: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  area_comunicacion: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  area_cognoscitivo: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  area_socioemocional: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estudiante_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
}, {
  tableName: 'seguimiento_infantil',
  timestamps: true
});

SeguimientoInfantil.belongsTo(PacienteAdulto, { 
  foreignKey: 'paciente_id', 
  as: 'paciente_adulto',
  constraints: false,
  scope: {
    tipo_paciente: 'adulto'
  }
});

SeguimientoInfantil.belongsTo(Usuario, { 
  foreignKey: 'usuario_id', 
  as: 'SeguimientoUsuario'
});

SeguimientoInfantil.belongsTo(Estudiante, { 
  foreignKey: 'estudiante_id', 
  as: 'SeguimientoEstudiante',
  allowNull: true
});

export default SeguimientoInfantil;