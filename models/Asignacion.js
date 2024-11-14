// src/models/Asignacion.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import Estudiante from './Estudiante.js';
import Institucion from './Institucion.js';
import Receptor from './Receptor.js';

class Asignacion extends Model {}

Asignacion.init ({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  },
  receptor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: false
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Asignacion',
  tableName: 'asignaciones',
  timestamps: false
});

Asignacion.belongsTo(Estudiante, { foreignKey: 'estudiante_id' });
Asignacion.belongsTo(Institucion, { foreignKey: 'institucion_id' });
Asignacion.belongsTo(Receptor, { foreignKey: 'receptor_id' });

export default Asignacion;