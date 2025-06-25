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
import Usuario from './Usuario.js';
import SeguimientoAdulto from './SeguimientoAdulto.js';
import PacienteAdulto from './PacienteAdulto.js';
import DiagnosticoFichaAdulto from './DiagnosticoFichaAdulto.js';

import PacienteDependencia from './PacienteDependencia.js';
import VisitaDomiciliaria from './VisitaDomiciliaria.js';
import SintomasVisita from './SintomasVisita.js';
import AdherenciaVisita from './AdherenciaVisita.js';
import NutricionVisita from './NutricionVisita.js';
import ActividadVisita from './ActividadVisita.js';
import EliminacionVisita from './EliminacionVisita.js';
import Phq9Visita from './Phq9Visita.js';
import YesavageVisita from './YesavageVisita.js';
import OtrosSintomasVisita from './OtrosSintomasVisita.js';

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

  FichaClinicaAdulto.hasMany(FichaTipoFamilia, {
    foreignKey: 'ficha_clinica_id',
    as: 'fichaTipoFamilia'
  });

  FichaTipoFamilia.belongsTo(TipoFamilia, {
    foreignKey: 'tipo_familia_id',
    as: 'tipoFamiliaAdulto'
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

  // Definir asociaciones
  Institucion.hasMany(FichaClinicaAdulto, {
    foreignKey: 'institucion_id',
    as: 'fichasAdultos'
  });

  Institucion.hasMany(FichaClinicaInfantil, {
    foreignKey: 'institucion_id',
    as: 'fichasInfantiles'
  });

  Institucion.belongsTo(TipoInstitucion, {
    foreignKey: 'tipo_id',
    as: 'tipoInstitucion'
  });

  DiagnosticoFichaAdulto.belongsTo(Diagnostico, {
    foreignKey: 'diagnostico_id',
    as: 'Diagnostico'
  });

  Diagnostico.hasMany(DiagnosticoFichaAdulto, {
    foreignKey: 'diagnostico_id',
    as: 'DiagnosticoFichaAdulto'
  });

  FichaClinicaAdulto.hasMany(DiagnosticoFichaAdulto, {
    foreignKey: 'ficha_clinica_id',
    as: 'DiagnosticoFichas'
  });

  DiagnosticoFichaAdulto.belongsTo(FichaClinicaAdulto, {
    foreignKey: 'ficha_clinica_id',
    as: 'FichaClinicaAdulto'
  });

  // Asociación PacienteDependencia - VisitaDomiciliaria (1 a Muchos)
  PacienteDependencia.hasMany(VisitaDomiciliaria, {
    foreignKey: 'paciente_dependencia_id',
    as: 'visitasDomiciliarias'
  });
  VisitaDomiciliaria.belongsTo(PacienteDependencia, {
    foreignKey: 'paciente_dependencia_id',
    as: 'pacienteDependencia'
  });

  // Asociación VisitaDomiciliaria - SintomasVisita (1 a 1)
  VisitaDomiciliaria.hasOne(SintomasVisita, {
    foreignKey: 'visita_id',
    as: 'sintomas'
  });
  SintomasVisita.belongsTo(VisitaDomiciliaria, {
    foreignKey: 'visita_id',
    as: 'visita'
  });

  // Asociación VisitaDomiciliaria - AdherenciaVisita (1 a 1)
  VisitaDomiciliaria.hasOne(AdherenciaVisita, {
    foreignKey: 'visita_id',
    as: 'adherencia'
  });
  AdherenciaVisita.belongsTo(VisitaDomiciliaria, {
    foreignKey: 'visita_id',
    as: 'visita'
  });

  // Asociación VisitaDomiciliaria - NutricionVisita (1 a 1)
  VisitaDomiciliaria.hasOne(NutricionVisita, {
    foreignKey: 'visita_id',
    as: 'nutricion'
  });
  NutricionVisita.belongsTo(VisitaDomiciliaria, {
    foreignKey: 'visita_id',
    as: 'visita'
  });

  // Asociación VisitaDomiciliaria - ActividadVisita (1 a 1)
  VisitaDomiciliaria.hasOne(ActividadVisita, {
    foreignKey: 'visita_id',
    as: 'actividad'
  });
  ActividadVisita.belongsTo(VisitaDomiciliaria, {
    foreignKey: 'visita_id',
    as: 'visita'
  });

  // Asociación VisitaDomiciliaria - EliminacionVisita (1 a 1)
  VisitaDomiciliaria.hasOne(EliminacionVisita, {
    foreignKey: 'visita_id',
    as: 'eliminacion'
  });
  EliminacionVisita.belongsTo(VisitaDomiciliaria, {
    foreignKey: 'visita_id',
    as: 'visita'
  });

  // Asociación VisitaDomiciliaria - Phq9Visita (1 a 1)
  VisitaDomiciliaria.hasOne(Phq9Visita, {
    foreignKey: 'visita_id',
    as: 'phq9'
  });
  Phq9Visita.belongsTo(VisitaDomiciliaria, {
    foreignKey: 'visita_id',
    as: 'visita'
  });

  // Asociación VisitaDomiciliaria - YesavageVisita (1 a 1)
  VisitaDomiciliaria.hasOne(YesavageVisita, {
    foreignKey: 'visita_id',
    as: 'yesavage'
  });
  YesavageVisita.belongsTo(VisitaDomiciliaria, {
    foreignKey: 'visita_id',
    as: 'visita'
  });

  // Asociación VisitaDomiciliaria - OtrosSintomasVisita (1 a 1)
  VisitaDomiciliaria.hasOne(OtrosSintomasVisita, {
    foreignKey: 'visita_id',
    as: 'otrosSintomas'
  });
  OtrosSintomasVisita.belongsTo(VisitaDomiciliaria, {
    foreignKey: 'visita_id',
    as: 'visita'
  });

  // Referencias a Usuario, Institucion y Estudiante en VisitaDomiciliaria:
  // VisitaDomiciliaria.belongsTo(Usuario, {
  //   foreignKey: 'usuario_id',
  //   as: 'usuario'
  // });
  // Usuario.hasMany(VisitaDomiciliaria, { foreignKey: 'usuario_id' });

  VisitaDomiciliaria.belongsTo(Institucion, {
    foreignKey: 'institucion_id',
    as: 'institucion'
  });
  Institucion.hasMany(VisitaDomiciliaria, { foreignKey: 'institucion_id' });

  VisitaDomiciliaria.belongsTo(Estudiante, {
    foreignKey: 'estudiante_id',
    as: 'estudiante'
  });

  Estudiante.hasMany(VisitaDomiciliaria, { foreignKey: 'estudiante_id' });

  PacienteDependencia.belongsTo(Institucion, {
    foreignKey: 'institucion_id',
    as: 'institucion'
  });
  Institucion.hasMany(PacienteDependencia, {
    foreignKey: 'institucion_id'
  });

  // Asociación entre PacienteDependencia y Diagnostico
  PacienteDependencia.belongsTo(Diagnostico, {
    foreignKey: 'diagnostico_id',
    as: 'DiagnosticoDependencia'
  });
  Diagnostico.hasMany(PacienteDependencia, {
    foreignKey: 'diagnostico_id',
    as: 'pacientesDependenciaDiagnostico'
  });

  // Asociación entre PacienteDependencia y Diagnostico
  PacienteDependencia.belongsTo(NivelEscolaridad, {
    foreignKey: 'escolaridad_id',
    as: 'NivelEscolaridadDependencia'
  });
  NivelEscolaridad.hasMany(PacienteDependencia, {
    foreignKey: 'escolaridad_id',
    as: 'pacientesDependenciaNivelEscolaridad'
  });

  // Asociación entre PacienteDependencia y CicloVitalFamiliar
  PacienteDependencia.belongsTo(CicloVitalFamiliar, {
    foreignKey: 'ciclo_vital_familiar_id',
    as: 'cicloVitalFamiliarDependencia'
  });
  CicloVitalFamiliar.hasMany(PacienteDependencia, {
    foreignKey: 'ciclo_vital_familiar_id',
    as: 'pacientesDependenciaCiclo'
  });

  // Asociación entre PacienteDependencia y CicloVitalFamiliar
  PacienteDependencia.belongsTo(TipoFamilia, {
    foreignKey: 'tipo_familia_id',
    as: 'TipoFamiliaDependencia'
});

TipoFamilia.hasMany(PacienteDependencia, {
    foreignKey: 'tipo_familia_id',
    as: 'pacientesDependenciaTipoFamilia'
});

  // Asociación entre PacienteDependencia y Usuario
  PacienteDependencia.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuarioDependencia'
  });
  Usuario.hasMany(PacienteDependencia, {
    foreignKey: 'usuario_id',
    as: 'pacientesDependenciaUsuario'
  });


  // Asociación entre PacienteDependencia y Usuario
  PacienteDependencia.belongsTo(Estudiante, {
    foreignKey: 'estudiante_id',
    as: 'estudianteDependencia'
  });
  Estudiante.hasMany(PacienteDependencia, {
    foreignKey: 'estudiante_id',
    as: 'pacientesDependenciaEstudiante'
  });

  // Asociación entre PacienteDependencia y Institucion
  PacienteDependencia.belongsTo(Institucion, {
    foreignKey: 'institucion_id',
    as: 'institucionDependencia'
  });
  Institucion.hasMany(PacienteDependencia, {
    foreignKey: 'institucion_id',
    as: 'pacientesDependenciaInstitucion'
  });

}