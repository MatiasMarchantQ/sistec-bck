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
import FactorRiesgoNino from './FactorRiesgoNino.js';
import FactorRiesgoFamiliar from './FactorRiesgoFamiliar.js';
import FichaFactorRiesgoNino from './FichaFactorRiesgoNino.js';
import FichaFactorRiesgoFamiliar from './FichaFactorRiesgoFamiliar.js';
import PadreTutor from './PadreTutor.js';
import PacienteInfantil from './PacienteInfantil.js';
import SeguimientoInfantil from './SeguimientoInfantil.js';
import NivelEscolaridad from './NivelEscolaridad.js';
import Diagnostico from './Diagnostico.js';
import SeguimientoAdulto from './SeguimientoAdulto.js';
import PacienteAdulto from './PacienteAdulto.js';

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

  FichaClinicaAdulto.belongsTo(CicloVitalFamiliar, {
    foreignKey: 'ciclo_vital_familiar_id',
    as: 'cicloVitalFamiliarAdulto'
  });
  
  CicloVitalFamiliar.hasMany(FichaClinicaAdulto, {
    foreignKey: 'ciclo_vital_familiar_id',
    as: 'fichasClinicasAdultos'
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

  FichaClinicaInfantil.hasMany(FichaTipoFamilia, {
    foreignKey: 'ficha_clinica_id',
    as: 'fichasTipoFamiliaInfantiles'
  });
  
  // Definición de la relación entre TipoFamilia y FichaTipoFamilia
  TipoFamilia.hasMany(FichaTipoFamilia, {
    foreignKey: 'tipo_familia_id',
    as: 'fichasTipoFamiliaInfantil'
  });
  
  // Definición de la relación entre FichaTipoFamilia y FichaClinicaInfantil
  FichaTipoFamilia.belongsTo(FichaClinicaInfantil, {
    foreignKey: 'ficha_clinica_id',
    as: 'fichaClinicaInfantil'
  });
  
  // Definición de la relación entre FichaTipoFamilia y TipoFamilia
  FichaTipoFamilia.belongsTo(TipoFamilia, {
    foreignKey: 'tipo_familia_id',
    as: 'tipoFamiliaInfantil'
  });

  FichaClinicaInfantil.belongsTo(CicloVitalFamiliar, {
    foreignKey: 'ciclo_vital_familiar_id',
    as: 'cicloVitalFamiliarInfantil'
  });
  
  CicloVitalFamiliar.hasMany(FichaClinicaInfantil, {
    foreignKey: 'ciclo_vital_familiar_id',
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

  FichaClinicaAdulto.belongsTo(Institucion, { foreignKey: 'institucion_id' });
  Institucion.hasMany(FichaClinicaAdulto, { foreignKey: 'institucion_id' });

  PacienteInfantil.hasMany(SeguimientoInfantil, {
    foreignKey: 'paciente_id',
    as: 'seguimientos_infantiles'
  });

  SeguimientoInfantil.belongsTo(PacienteInfantil, {
    foreignKey: 'paciente_id',
    as: 'paciente_infantil'
  });

  Diagnostico.hasMany(FichaClinicaAdulto, {
    foreignKey: 'diagnostico_id',
    as: 'fichasClinicasAdulto'
  });

  FichaClinicaAdulto.belongsTo(Diagnostico, {
    foreignKey: 'diagnostico_id',
    as: 'diagnostico'
  });

  FichaClinicaAdulto.hasMany(FichaClinicaAdulto, {
    foreignKey: 'paciente_id',
    as: 'reevaluaciones',
    scope: {
        is_reevaluacion: true
    }
  });

// Para FichaClinicaInfantil (similar)
FichaClinicaInfantil.hasMany(FichaClinicaInfantil, {
    foreignKey: 'paciente_id',
    as: 'reevaluaciones',
     scope: {
        is_reevaluacion: true
    }
  });  

  FichaClinicaAdulto.belongsTo(PacienteAdulto, { foreignKey: 'paciente_id' });
}