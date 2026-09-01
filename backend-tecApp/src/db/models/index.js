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
import Asignacion from "./asignaciones-model.js";
import Cargo from "./cargos-model.js";

import Biblioteca from "./biblioteca-model.js";
import Prestamo from "./prestamos-model.js";
import Recurso from "./recursos-model.js";

import Noticia from "./noticias-model.js";
import Comunicado from "./comunicados-model.js";
import ObjetoPerdido from "./objetos-perdidos-model.js";
import CodigoDeVerificacion from "./codigoDeVerificacion-model.js";

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

Cargo.hasMany(Personal, { foreignKey: "id_cargo" });
Personal.belongsTo(Cargo, { foreignKey: "id_cargo", as: "cargoPersonal" });

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
  Materia,
  Biblioteca,
  Prestamo,
  Recurso,
  Noticia,
  Comunicado,
  ObjetoPerdido,
  CodigoDeVerificacion,
};
