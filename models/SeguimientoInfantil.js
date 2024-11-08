import { Model, DataTypes } from 'sequelize';
import sequelize from './index.js';
import PacienteAdulto from './PacienteAdulto.js';

const SeguimientoInfantil = sequelize.define('SeguimientoInfantil', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  edad_meses: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  grupo_edad: {
    type: DataTypes.STRING,
    allowNull: true
  },
  area_motor_grueso: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('area_motor_grueso');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('area_motor_grueso', JSON.stringify(value));
    }
  },
  area_motor_fino: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('area_motor_fino');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('area_motor_fino', JSON.stringify(value));
    }
  },
  area_comunicacion: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('area_comunicacion');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('area_comunicacion', JSON.stringify(value));
    }
  },
  area_cognoscitivo: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('area_cognoscitivo');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('area_cognoscitivo', JSON.stringify(value));
    }
  },
  area_socioemocional: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('area_socioemocional');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('area_socioemocional', JSON.stringify(value));
    }
  },
  recomendacion_motora: {
    type: DataTypes.TEXT
  },
  recomendacion_lenguaje: {
    type: DataTypes.TEXT
  },
  recomendacion_socioemocional: {
    type: DataTypes.TEXT
  },
  recomendacion_cognitiva: {
    type: DataTypes.TEXT
  }
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

export default SeguimientoInfantil;