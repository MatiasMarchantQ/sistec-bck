// src/models/RespuestaEvaluacion.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import Seguimiento from './Seguimiento.js';

class RespuestaEvaluacion extends Model {}

RespuestaEvaluacion.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  seguimiento_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Seguimiento,
      key: 'id'
    },
    allowNull: false
  },
  area: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  pregunta: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  respuesta: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'RespuestaEvaluacion',
  tableName: 'respuestas_evaluacion',
  timestamps: false
});

RespuestaEvaluacion.belongsTo(Seguimiento, { foreignKey: 'seguimiento_id' });

export default RespuestaEvaluacion;