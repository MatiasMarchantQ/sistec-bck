// models/DiagnosticoFichaAdulto.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import FichaClinicaAdulto from './FichaClinicaAdulto.js';
import Diagnostico from './Diagnostico.js';

class DiagnosticoFichaAdulto extends Model {}

DiagnosticoFichaAdulto.init({
  ficha_clinica_id: {
    type: DataTypes.INTEGER,
    references: {
      model: FichaClinicaAdulto,
      key: 'id'
    },
    primaryKey: true
  },
  diagnostico_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Diagnostico,
      key: 'id'
    },
    primaryKey: true
  },
  es_diagnostico_otro: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  diagnostico_otro_texto: {
    type: DataTypes.STRING(200),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'DiagnosticoFichaAdulto',
  tableName: 'diagnosticos_fichas_adulto',
  timestamps: false
});

export default DiagnosticoFichaAdulto;