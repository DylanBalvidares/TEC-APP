import Alumno from "./alumnos-model.js";
import Curso from "./cursos-model.js";
import Asistencia from "./asistencias-model.js";
import Profesor from "./profesores-model.js";
import Autoridad from "./autoridades-model.js";

Curso.hasMany(Alumno, {
  foreignKey: "id_curso",
});
Alumno.belongsTo(Curso, {
  foreignKey: "id_curso",
});

Alumno.hasMany(Asistencia, {
  foreignKey: "id_alumno",
});
Asistencia.belongsTo(Alumno, {
  foreignKey: "id_alumno",
});

Profesor.hasMany(Curso, {
  foreignKey: "id_profesor",
});
Curso.belongsTo(Profesor, {
  foreignKey: "id_profesor",
});

Curso.hasMany(Asistencia, {
  foreignKey: "id_asistencia",
});

Asistencia.belongsTo(Curso, {
  foreignKey: "id_curso",
});

export { Curso, Alumno, Asistencia, Profesor, Autoridad };
