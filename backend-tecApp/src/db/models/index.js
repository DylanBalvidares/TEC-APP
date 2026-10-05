import Usuario from "./user-model.js";
import Rol from "./roles-model.js";
import Permiso from "./permisos-model.js";
import RolPermiso from "./rol-permisos-model.js";

import Alumno from "./alumnos-model.js";
import Curso from "./cursos-model.js";
import Asistencia from "./asistencias-model.js";
import Profesor from "./profesores-model.js";
import Personal from "./personal-model.js";
import Materia from "./materias-model.js";
import Nota from "./notas-model.js";
import HistorialNota from "./historial-notas-model.js";
import PeriodoBoletin from "./periodos-boletin-model.js";
import BoletinMateria from "./boletin-materias-model.js";
import BoletinCalificacion from "./boletin-calificaciones-model.js";
import BoletinFinalizacion from "./boletin-finalizaciones-model.js";
import BoletinReapertura from "./boletin-reaperturas-model.js";
import BoletinHistorial from "./boletin-historial-model.js";
import Asignacion from "./asignaciones-model.js";
import Cargo from "./cargos-model.js";
import PlanEstudio from "./planes-estudio-model.js";
import PlanMateria from "./plan-materias-model.js";
import Correlativa from "./correlativas-model.js";

import Biblioteca from "./biblioteca-model.js";
import Prestamo from "./prestamos-model.js";
import Recurso from "./recursos-model.js";

import Noticia from "./noticias-model.js";
import Comunicado from "./comunicados-model.js";
import ObjetoPerdido from "./objetos-perdidos-model.js";
import CodigoDeVerificacion from "./codigoDeVerificacion-model.js";
import Correo from "./correo-model.js";
import MensajeWhatsapp from "./mensaje-whatsapp-model.js";
import Auditoria from "./auditoria-model.js";
import Horario from "./horario-model.js";
import Sancion from "./sancion-model.js";
import Observacion from "./observacion-model.js";
import Notificacion from "./notificacion-model.js";
import NotificacionPreferencia from "./notificacion-preferencia-model.js";

// ==========================================
// Relaciones: Usuarios & RBAC
// ==========================================
Usuario.belongsTo(Rol, { foreignKey: "id_rol", as: "rol" });
Rol.hasMany(Usuario, { foreignKey: "id_rol" });

Rol.belongsToMany(Permiso, {
  through: RolPermiso,
  foreignKey: "id_rol",
  otherKey: "id_permiso",
  as: "permisos",
});

Permiso.belongsToMany(Rol, {
  through: RolPermiso,
  foreignKey: "id_permiso",
  otherKey: "id_rol",
});

// ==========================================
// Relaciones: Académico
// ==========================================
Curso.belongsTo(Profesor, { foreignKey: "id_profesor_titular", as: "profesorTitular" });
Profesor.hasMany(Curso, { foreignKey: "id_profesor_titular", as: "cursosAsignados" });

Curso.belongsTo(Personal, { foreignKey: "id_preceptor", as: "preceptorAsignado" });
Personal.hasMany(Curso, { foreignKey: "id_preceptor", as: "cursosPreceptor" });

Curso.hasMany(Alumno, { foreignKey: "id_curso" });
Alumno.belongsTo(Curso, { foreignKey: "id_curso" });

Alumno.hasMany(Asistencia, { foreignKey: "id_alumno" });
Asistencia.belongsTo(Alumno, { foreignKey: "id_alumno" });

Curso.hasMany(Asistencia, { foreignKey: "id_curso" });
Asistencia.belongsTo(Curso, { foreignKey: "id_curso" });

Profesor.hasMany(Asignacion, { foreignKey: "id_profesor" });
Asignacion.belongsTo(Profesor, { foreignKey: "id_profesor", as: "profesorAsignacion" });

Curso.hasMany(Asignacion, { foreignKey: "id_curso" });
Asignacion.belongsTo(Curso, { foreignKey: "id_curso", as: "cursoAsignacion" });

Materia.hasMany(Asignacion, { foreignKey: "id_materia" });
Asignacion.belongsTo(Materia, { foreignKey: "id_materia", as: "materiaAsignacion" });

Alumno.hasMany(Nota, { foreignKey: "id_alumno", onDelete: "CASCADE" });
Nota.belongsTo(Alumno, { foreignKey: "id_alumno" });

Asignacion.hasMany(Nota, { foreignKey: "id_asignacion", onDelete: "CASCADE" });
Nota.belongsTo(Asignacion, { foreignKey: "id_asignacion" });

Nota.hasMany(HistorialNota, { foreignKey: "id_nota", onDelete: "CASCADE" });
HistorialNota.belongsTo(Nota, { foreignKey: "id_nota" });
HistorialNota.belongsTo(Alumno, { foreignKey: "id_alumno" });
HistorialNota.belongsTo(Asignacion, { foreignKey: "id_asignacion" });
HistorialNota.belongsTo(Usuario, { foreignKey: "modificado_por", as: "usuarioModificador" });

// ==========================================
// Relaciones: Boletines cuatrimestrales
// (aditivo: no toca Nota ni HistorialNota)
// ==========================================
PeriodoBoletin.hasMany(BoletinMateria, { foreignKey: "id_periodo" });
BoletinMateria.belongsTo(PeriodoBoletin, { foreignKey: "id_periodo" });
Asignacion.hasMany(BoletinMateria, { foreignKey: "id_asignacion" });
BoletinMateria.belongsTo(Asignacion, { foreignKey: "id_asignacion" });
BoletinMateria.belongsTo(Profesor, { foreignKey: "id_profesor", as: "profesorSnapshot" });
BoletinMateria.belongsTo(PlanEstudio, { foreignKey: "id_plan", as: "planSnapshot" });

PeriodoBoletin.hasMany(BoletinCalificacion, { foreignKey: "id_periodo" });
BoletinCalificacion.belongsTo(PeriodoBoletin, { foreignKey: "id_periodo" });

Asignacion.hasMany(BoletinCalificacion, { foreignKey: "id_asignacion" });
BoletinCalificacion.belongsTo(Asignacion, { foreignKey: "id_asignacion" });

Alumno.hasMany(BoletinCalificacion, { foreignKey: "id_alumno" });
BoletinCalificacion.belongsTo(Alumno, { foreignKey: "id_alumno" });

PeriodoBoletin.hasMany(BoletinFinalizacion, { foreignKey: "id_periodo" });
BoletinFinalizacion.belongsTo(PeriodoBoletin, { foreignKey: "id_periodo" });
Asignacion.hasMany(BoletinFinalizacion, { foreignKey: "id_asignacion" });
BoletinFinalizacion.belongsTo(Asignacion, { foreignKey: "id_asignacion" });

PeriodoBoletin.hasMany(BoletinReapertura, { foreignKey: "id_periodo" });
BoletinReapertura.belongsTo(PeriodoBoletin, { foreignKey: "id_periodo" });
Asignacion.hasMany(BoletinReapertura, { foreignKey: "id_asignacion" });
BoletinReapertura.belongsTo(Asignacion, { foreignKey: "id_asignacion" });

PeriodoBoletin.hasMany(BoletinHistorial, { foreignKey: "id_periodo" });
BoletinHistorial.belongsTo(PeriodoBoletin, { foreignKey: "id_periodo" });
BoletinHistorial.belongsTo(Usuario, { foreignKey: "modificado_por", as: "usuarioModificador" });

Cargo.hasMany(Personal, { foreignKey: "id_cargo" });
Personal.belongsTo(Cargo, { foreignKey: "id_cargo", as: "cargoPersonal" });

Asignacion.hasMany(Horario, { foreignKey: "id_asignacion" });
Horario.belongsTo(Asignacion, { foreignKey: "id_asignacion" });

Usuario.hasMany(Comunicado, { foreignKey: "autor_id" });
Comunicado.belongsTo(Usuario, { foreignKey: "autor_id", as: "autor" });

// ==========================================
// Relaciones: Planes de estudio
// ==========================================
PlanEstudio.hasMany(PlanMateria, { foreignKey: "id_plan", as: "materiasPlan" });
PlanMateria.belongsTo(PlanEstudio, { foreignKey: "id_plan", as: "plan" });

Materia.hasMany(PlanMateria, { foreignKey: "id_materia" });
PlanMateria.belongsTo(Materia, { foreignKey: "id_materia", as: "materia" });

PlanMateria.hasMany(Correlativa, { foreignKey: "id_plan_materia", as: "correlativas" });
Correlativa.belongsTo(PlanMateria, { foreignKey: "id_plan_materia", as: "planMateria" });
Correlativa.belongsTo(PlanMateria, { foreignKey: "id_plan_materia_req", as: "requerida" });

// ==========================================
// Relaciones: Biblioteca
// ==========================================
Biblioteca.hasMany(Recurso, { foreignKey: "id_biblioteca" });
Recurso.belongsTo(Biblioteca, { foreignKey: "id_biblioteca" });

Recurso.hasMany(Prestamo, { foreignKey: "id_recurso" });
Prestamo.belongsTo(Recurso, { foreignKey: "id_recurso" });

export {
  Usuario,
  Rol,
  Permiso,
  RolPermiso,
  Alumno,
  Curso,
  Asistencia,
  Profesor,
  Personal,
  Cargo,
  Asignacion,
  Nota,
  HistorialNota,
  PeriodoBoletin,
  BoletinMateria,
  BoletinCalificacion,
  BoletinFinalizacion,
  BoletinReapertura,
  BoletinHistorial,
  Materia,
  PlanEstudio,
  PlanMateria,
  Correlativa,
  Biblioteca,
  Prestamo,
  Recurso,
  Noticia,
  Comunicado,
  ObjetoPerdido,
  CodigoDeVerificacion,
  Correo,
  MensajeWhatsapp,
  Auditoria,
  Horario,
  Sancion,
  Observacion,
  Notificacion,
  NotificacionPreferencia,
};
