import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import PacienteInfantil from './PacienteInfantil.js';
import Institucion from './Institucion.js';
import Usuario from './Usuario.js';
import Estudiante from './Estudiante.js';

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
  ciclo_vital_familiar_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'CicloVitalFamiliar',
      key: 'id'
    }
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
  },
  is_reevaluacion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ficha_original_id: {
    type: DataTypes.INTEGER,
    references: {
        model: 'fichas_clinicas_infantiles', // Usa el nombre de la tabla en lugar del modelo
        key: 'id'
    },
    allowNull: true
  }
}, {
  tableName: 'fichas_clinicas_infantiles',
  timestamps: true
});

FichaClinicaInfantil.belongsTo(PacienteInfantil, { foreignKey: 'paciente_id' });
FichaClinicaInfantil.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
FichaClinicaInfantil.belongsTo(Estudiante, { foreignKey: 'estudiante_id', as: 'estudiante' });
FichaClinicaInfantil.belongsTo(Institucion, { foreignKey: 'institucion_id', as: 'institucion' });


export default FichaClinicaInfantil;