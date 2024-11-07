// src/models/FichaClinicaInfantil.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import PacienteNino from './PacienteNino.js';
import Estudiante from './Estudiante.js';
import Institucion from './Institucion.js';
import RelacionDpmDsm from './RelacionDpmDsm.js';
import Usuario from './Usuario.js';

class FichaClinicaInfantil extends Model {}

FichaClinicaInfantil.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    references: {
      model: PacienteNino,
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
  puntaje_dpm: {
    type: DataTypes.STRING(50),
    references: {
      model: RelacionDpmDsm,
      key: 'puntaje_dpm'
    }
  },
  diagnostico_dsm: {
    type: DataTypes.STRING(100),
    references: {
      model: RelacionDpmDsm,
      key: 'diagnostico_dsm'
    }
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
  modelName: 'FichaClinicaInfantil',
  tableName: 'fichas_clinicas_infantiles',
  timestamps: false
});

FichaClinicaInfantil.belongsTo(PacienteNino, { foreignKey: 'paciente_id' });
FichaClinicaInfantil.belongsTo(Estudiante, { foreignKey: 'estudiante_id' });
FichaClinicaInfantil.belongsTo(Institucion, { foreignKey: 'institucion_id' });
FichaClinicaInfantil.belongsTo(RelacionDpmDsm, { foreignKey: 'puntaje_dpm' });
FichaClinicaInfantil.belongsTo(Usuario, { foreignKey: 'usuario_id' }); // Nueva relación

export default FichaClinicaInfantil;