// models/associations.js
import Institucion from './Institucion.js';
import TipoInstitucion from './TipoInstitucion.js';
import Receptor from './Receptor.js';
import Asignacion from './Asignacion.js';
import Estudiante from './Estudiante.js';
import FichaClinicaAdulto from './FichaClinicaAdulto.js';
import TipoFamilia from './TipoFamilia.js';
import FichaTipoFamilia from './FichaTipoFamilia.js';
import CicloVitalFamiliar from './CicloVitalFamiliar.js';
import FichaCicloVital from './FichaCicloVital.js';

export function setupAssociations() {
  Institucion.hasMany(Receptor, { as: 'receptores', foreignKey: 'institucion_id' });
  Receptor.belongsTo(Institucion, { foreignKey: 'institucion_id' });

  Institucion.belongsTo(TipoInstitucion, { foreignKey: 'tipo_id' });
  TipoInstitucion.hasMany(Institucion, { foreignKey: 'tipo_id' });

  Asignacion.belongsTo(Estudiante, { foreignKey: 'estudiante_id' });
  Estudiante.hasMany(Asignacion, { foreignKey: 'estudiante_id' });

  Asignacion.belongsTo(Institucion, { foreignKey: 'institucion_id' });
  Institucion.hasMany(Asignacion, { foreignKey: 'institucion_id' });

  // Asociaciones many-to-many
  FichaClinicaAdulto.belongsToMany(TipoFamilia, {
    through: FichaTipoFamilia,
    foreignKey: 'ficha_clinica_id',
    otherKey: 'tipo_familia_id',
    as: 'tiposFamilia'
  });

  TipoFamilia.belongsToMany(FichaClinicaAdulto, {
    through: FichaTipoFamilia,
    foreignKey: 'tipo_familia_id',
    otherKey: 'ficha_clinica_id',
    as: 'fichasClinicas'
  });

  FichaClinicaAdulto.belongsToMany(CicloVitalFamiliar, {
    through: FichaCicloVital,
    foreignKey: 'ficha_clinica_id',
    otherKey: 'ciclo_vital_familiar_id',
    as: 'ciclosVitalesFamiliares'
  });

  CicloVitalFamiliar.belongsToMany(FichaClinicaAdulto, {
    through: FichaCicloVital,
    foreignKey: 'ciclo_vital_familiar_id',
    otherKey: 'ficha_clinica_id',
    as: 'fichasClinicas'
  });
}