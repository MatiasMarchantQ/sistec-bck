// src/models/Estudiante.js
import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import Rol from './Rol.js';

class Estudiante extends Model {}

Estudiante.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombres: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  rut: {
    type: DataTypes.STRING(12),
    allowNull: false,
    unique: true
  },
  correo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  contrasena: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  debe_cambiar_contrasena: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  contador_registros: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  anos_cursados: {
    type: DataTypes.STRING
  },
  semestre: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Rol,
      key: 'id'
    }
  },
  refresh_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reset_password_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Estudiante',
  tableName: 'estudiantes',
  timestamps: false
});

Estudiante.belongsTo(Rol, { foreignKey: 'rol_id' });

export default Estudiante;