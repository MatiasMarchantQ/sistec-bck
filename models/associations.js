// src/models/associations.js
import Institucion from './Institucion.js';
import TipoInstitucion from './TipoInstitucion.js';
import Receptor from './Receptor.js';
import Asignacion from './Asignacion.js';
import Estudiante from './Estudiante.js';

export function setupAssociations() {
  // Asociación entre Institucion y Receptor
  Institucion.hasMany(Receptor, { as: 'receptores', foreignKey: 'institucion_id' });
  Receptor.belongsTo(Institucion, { foreignKey: 'institucion_id' });

  // Asociación entre Institucion y TipoInstitucion
  Institucion.belongsTo(TipoInstitucion, { foreignKey: 'tipo_id' });
  TipoInstitucion.hasMany(Institucion, { foreignKey: 'tipo_id' });

  // Asociación entre Asignacion y Estudiante
  Asignacion.belongsTo(Estudiante, { foreignKey: 'estudiante_id' });
  Estudiante.hasMany(Asignacion, { foreignKey: 'estudiante_id' });

  // Asociación entre Asignacion e Institucion
  Asignacion.belongsTo(Institucion, { foreignKey: 'institucion_id' });
  Institucion.hasMany(Asignacion, { foreignKey: 'institucion_id' });
}