// src/models/FichaClinicaAdulto.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import PacienteAdulto from './PacienteAdulto.js';
import Estudiante from './Estudiante.js';
import Institucion from './Institucion.js';
import NivelEscolaridad from './NivelEscolaridad.js';
import Usuario from './Usuario.js';

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
  diagnostico: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  escolaridad_id: {
    type: DataTypes.INTEGER,
    references: {
      model: NivelEscolaridad,
      key: 'id'
    },
    allowNull: false
  },
  ocupacion: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  con_quien_vive: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  horario_llamada: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  conectividad: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  valor_hbac1: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  alcohol_drogas: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tabaquismo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  estudiante_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Estudiante,
      key: 'id'
    },
    allowNull: true 
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Usuario,
      key: 'id'
    },
    allowNull: true
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
  timestamps: true
});


FichaClinicaAdulto.belongsTo(PacienteAdulto, { foreignKey: 'paciente_id' });
FichaClinicaAdulto.belongsTo(Estudiante, { foreignKey: 'estudiante_id' });
FichaClinicaAdulto.belongsTo(Institucion, { foreignKey: 'institucion_id' });
FichaClinicaAdulto.belongsTo(NivelEscolaridad, { foreignKey: 'escolaridad_id' });
FichaClinicaAdulto.belongsTo(Usuario, { foreignKey: 'usuario_id' });

export default FichaClinicaAdulto;