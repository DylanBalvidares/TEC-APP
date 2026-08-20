import Alumno from "./alumnos-model.js";
import Curso from "./cursos-model.js";
import Asistencia from "./asistencias-model.js";
import Profesor from "./profesores-model.js";
import Personal from "./personal-model.js";
import Materia from "./materias-model.js";
import Nota from "./notas-model.js";
import Asignacion from "./asignaciones-model.js";
import Cargo from "./cargos-model.js";

Curso.belongsTo(Profesor, {
  foreignKey: "id_profesor_titular",
  as: "profesorTitular",
});

Profesor.hasMany(Curso, {
  foreignKey: "id_profesor_titular",
  as: "cursosAsignados",
});

Curso.belongsTo(Personal, {
  foreignKey: "id_preceptor",
  as: "preceptorAsignado",
});

Personal.hasMany(Curso, {
  foreignKey: "id_preceptor",
  as: "cursosPreceptor",
});

// ==========================================
// Relaciones: Curso <-> Alumno
// ==========================================
Curso.hasMany(Alumno, { foreignKey: "id_curso" });
Alumno.belongsTo(Curso, { foreignKey: "id_curso" });

// ==========================================
// Relaciones: Asistencia
// ==========================================
Alumno.hasMany(Asistencia, {
  foreignKey: "id_alumno",
});
Asistencia.belongsTo(Alumno, {
  foreignKey: "id_alumno",
});

Curso.hasMany(Asistencia, { foreignKey: "id_curso" }); // <- Corregido: antes apuntaba a id_asistencia
Asistencia.belongsTo(Curso, { foreignKey: "id_curso" });

// ==========================================
// Relaciones: Profesor <-> Asignación <-> Materia/Curso
// ==========================================
Profesor.hasMany(Asignacion, {
  foreignKey: "id_profesor",
});
Asignacion.belongsTo(Profesor, {
  foreignKey: "id_profesor",
  as: "profesorAsignacion",
});

Curso.hasMany(Asignacion, {
  foreignKey: "id_curso",
});

Asignacion.belongsTo(Curso, {
  foreignKey: "id_curso",
  as: "cursoAsignacion",
});

Materia.hasMany(Asignacion, {
  foreignKey: "id_materia",
});
Asignacion.belongsTo(Materia, {
  foreignKey: "id_materia",
  as: "materiaAsignacion",
});

// ==========================================
// NUEVAS RELACIONES: Sistema de Notas (0.0 a 10.0)
// ==========================================
// Una nota pertenece a un alumno específico
Alumno.hasMany(Nota, { foreignKey: "id_alumno", onDelete: "CASCADE" });
Nota.belongsTo(Alumno, { foreignKey: "id_alumno" });

// Una nota pertenece a una asignación específica
Asignacion.hasMany(Nota, {
  foreignKey: "id_asignacion",
  onDelete: "CASCADE",
});

Nota.belongsTo(Asignacion, {
  foreignKey: "id_asignacion",
});

Cargo.hasMany(Personal, {
  foreignKey: "id_cargo",
});

Personal.belongsTo(Cargo, {
  foreignKey: "id_cargo",
  as: "cargoPersonal",
});

export {
  Curso,
  Alumno,
  Asistencia,
  Profesor,
  Personal,
  Cargo,
  Asignacion,
  Nota,
  Materia,
};
