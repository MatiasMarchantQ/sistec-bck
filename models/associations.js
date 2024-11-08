// models/associations.js
import Institucion from './Institucion.js';
import TipoInstitucion from './TipoInstitucion.js';
import Receptor from './Receptor.js';
import Asignacion from './Asignacion.js';
import Estudiante from './Estudiante.js';
import FichaClinicaAdulto from './FichaClinicaAdulto.js';
import FichaClinicaInfantil from './FichaClinicaInfantil.js';
import TipoFamilia from './TipoFamilia.js';
import FichaTipoFamilia from './FichaTipoFamilia.js';
import CicloVitalFamiliar from './CicloVitalFamiliar.js';
import FichaCicloVital from './FichaCicloVital.js';
import FactorRiesgoNino from './FactorRiesgoNino.js';
import FactorRiesgoFamiliar from './FactorRiesgoFamiliar.js';
import FichaFactorRiesgoNino from './FichaFactorRiesgoNino.js';
import FichaFactorRiesgoFamiliar from './FichaFactorRiesgoFamiliar.js';
import PadreTutor from './PadreTutor.js';
import PacienteInfantil from './PacienteInfantil.js';
import SeguimientoInfantil from './SeguimientoInfantil.js';
import NivelEscolaridad from './NivelEscolaridad.js';

export function setupAssociations() {
  Institucion.hasMany(Receptor, { as: 'receptores', foreignKey: 'institucion_id' });
  Receptor.belongsTo(Institucion, { foreignKey: 'institucion_id' });

  Institucion.belongsTo(TipoInstitucion, { foreignKey: 'tipo_id' });
  TipoInstitucion.hasMany(Institucion, { foreignKey: 'tipo_id' });

  Asignacion.belongsTo(Estudiante, { foreignKey: 'estudiante_id' });
  Estudiante.hasMany(Asignacion, { foreignKey: 'estudiante_id' });

  Asignacion.belongsTo(Institucion, { foreignKey: 'institucion_id' });
  Institucion.hasMany(Asignacion, { foreignKey: 'institucion_id' });

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

  FichaClinicaInfantil.belongsToMany(FactorRiesgoNino, {
    through: FichaFactorRiesgoNino,
    foreignKey: 'ficha_clinica_id',
    otherKey: 'factor_riesgo_nino_id',
    as: 'factoresRiesgoNino'
  });

  FactorRiesgoNino.belongsToMany(FichaClinicaInfantil, {
    through: FichaFactorRiesgoNino,
    foreignKey: 'factor_riesgo_nino_id',
    otherKey: 'ficha_clinica_id',
    as: 'fichasClinicasNino'
  });

  FichaClinicaInfantil.belongsToMany(FactorRiesgoFamiliar, {
    through: FichaFactorRiesgoFamiliar,
    foreignKey: 'ficha_clinica_id',
    otherKey: 'factor_riesgo_familiar_id',
    as: 'factoresRiesgoFamiliar'
  });

  FactorRiesgoFamiliar.belongsToMany(FichaClinicaInfantil, {
    through: FichaFactorRiesgoFamiliar,
    foreignKey: 'factor_riesgo_familiar_id',
    otherKey: 'ficha_clinica_id',
    as: 'fichasClinicasFamiliar'
  });

  FichaClinicaInfantil.belongsToMany(TipoFamilia, {
    through: FichaTipoFamilia,
    foreignKey: 'ficha_clinica_id',
    otherKey: 'tipo_familia_id',
    as: 'tiposFamiliaInfantil'
  });

  TipoFamilia.belongsToMany(FichaClinicaInfantil, {
    through: FichaTipoFamilia,
    foreignKey: 'tipo_familia_id',
    otherKey: 'ficha_clinica_id',
    as: 'fichasClinicasInfantiles'
  });

  FichaClinicaInfantil.belongsToMany(CicloVitalFamiliar, {
    through: FichaCicloVital,
    foreignKey: 'ficha_clinica_id',
    otherKey: 'ciclo_vital_familiar_id',
    as: 'ciclosVitalesFamiliaresInfantil'
  });

  CicloVitalFamiliar.belongsToMany(FichaClinicaInfantil, {
    through: FichaCicloVital,
    foreignKey: 'ciclo_vital_familiar_id',
    otherKey: 'ficha_clinica_id',
    as: 'fichasClinicasInfantiles'
  });

  FichaClinicaInfantil.hasMany(PadreTutor, { 
    foreignKey: 'ficha_clinica_id',
    as: 'padresTutores'
  });

  PadreTutor.belongsTo(FichaClinicaInfantil, { 
      foreignKey: 'ficha_clinica_id'
  });

  FichaClinicaInfantil.belongsTo(Institucion, { foreignKey: 'institucion_id' });
  Institucion.hasMany(FichaClinicaInfantil, { foreignKey: 'institucion_id' });

  PacienteInfantil.hasMany(SeguimientoInfantil, {
    foreignKey: 'paciente_id',
    as: 'seguimientos_infantiles'
  });

  SeguimientoInfantil.belongsTo(PacienteInfantil, {
    foreignKey: 'paciente_id',
    as: 'paciente_infantil'
  });
}