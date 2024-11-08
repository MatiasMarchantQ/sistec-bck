import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import PacienteInfantil from './PacienteInfantil.js';
import Institucion from './Institucion.js';


const FichaClinicaInfantil = sequelize.define('FichaClinicaInfantil', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: PacienteInfantil,
      key: 'id'
    }
  },
  puntaje_dpm: {
    type: DataTypes.STRING,
    allowNull: true
  },
  diagnostico_dsm: {
    type: DataTypes.STRING,
    allowNull: true
  },
  con_quien_vive: {
    type: DataTypes.STRING,
    allowNull: true
  },
  localidad: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estudiante_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  institucion_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'fichas_clinicas_infantiles',
  timestamps: true
});

FichaClinicaInfantil.belongsTo(PacienteInfantil, { foreignKey: 'paciente_id' });
FichaClinicaInfantil.belongsTo(Institucion, { foreignKey: 'institucion_id' });

export default FichaClinicaInfantil;