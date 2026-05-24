import Alumno from "./alumnos-model.js";
import Curso from "./cursos-model.js";
import Asistencia from "./asistencias-model.js";
import Profesor from "./profesores-model.js";
import Autoridad from "./autoridades-model.js";
import Materia from "./materias-model.js";
import Nota from "./notas-model.js";
import Asignacion from "./asignaciones-model.js";

// ==========================================
// Relaciones: Curso <-> Alumno
// ==========================================
Curso.hasMany(Alumno, { foreignKey: "id_curso" });
Alumno.belongsTo(Curso, { foreignKey: "id_curso" });

// ==========================================
// Relaciones: Asistencia
// ==========================================
Alumno.hasMany(Asistencia, { foreignKey: "id_alumno" });
Asistencia.belongsTo(Alumno, { foreignKey: "id_alumno" });

Curso.hasMany(Asistencia, { foreignKey: "id_curso" }); // <- Corregido: antes apuntaba a id_asistencia
Asistencia.belongsTo(Curso, { foreignKey: "id_curso" });

// ==========================================
// Relaciones: Profesor <-> Asignación <-> Materia/Curso
// ==========================================
Profesor.hasMany(Asignacion, { foreignKey: "id_profesor" });
Asignacion.belongsTo(Profesor, { foreignKey: "id_profesor" });

Curso.hasMany(Asignacion, { foreignKey: "id_curso" });
Asignacion.belongsTo(Curso, { foreignKey: "id_curso" });

Materia.hasMany(Asignacion, { foreignKey: "id_materia" });
Asignacion.belongsTo(Materia, { foreignKey: "id_materia" });

// ==========================================
// NUEVAS RELACIONES: Sistema de Notas (0.0 a 10.0)
// ==========================================
// Una nota pertenece a un alumno específico
Alumno.hasMany(Nota, { foreignKey: "id_alumno", onDelete: "CASCADE" });
Nota.belongsTo(Alumno, { foreignKey: "id_alumno" });

// Una nota pertenece a una asignación específica
Asignacion.hasMany(Nota, { foreignKey: "id_asignacion", onDelete: "CASCADE" });
Nota.belongsTo(Asignacion, { foreignKey: "id_asignacion" });

export {
  Curso,
  Alumno,
  Asistencia,
  Profesor,
  Autoridad,
  Asignacion,
  Nota,
  Materia,
};
