-- ============================================================
--  Base de datos: gestion_tecnica2
--  Versión: actualizada y corregida
--  Motor: MySQL 8+ / MariaDB 10.5+
-- ============================================================

-- Configuración inicial de variables de entorno del servidor
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

-- Inicio de la transacción para asegurar atomicidad en la creación del esquema
START TRANSACTION;

-- Establecimiento de la zona horaria global de la sesión
SET time_zone = "+00:00";

-- Eliminación de la base de datos preexistente para evitar conflictos de duplicación
DROP DATABASE IF EXISTS gestion_tecnica2;

-- Creación de la base de datos especificando el juego de caracteres ideal para soporte multilenguaje (utf8mb4)
CREATE DATABASE gestion_tecnica2 CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Selección de la base de datos activa para las siguientes operaciones
USE gestion_tecnica2;

-- ============================================================
-- ROL-BASED ACCESS CONTROL (RBAC) / CONTROL DE ACCESO
-- ============================================================

-- Tabla 'roles': Define las categorías o perfiles de los distintos actores institucionales
CREATE TABLE `roles` (
    `id_rol` int(11) NOT NULL AUTO_INCREMENT,
    `nombre_rol` varchar(50) NOT NULL,
    PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserción de los roles requeridos para el funcionamiento del sistema escolar
INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES
(1, 'alumno'), (2, 'delegado'), (3, 'profesor'),
(4, 'preceptor'), (5, 'bibliotecario'), (6, 'tutor'),
(7, 'invitado'), (8, 'administrativo'), (9, 'root');

-- Tabla 'permisos': Listado de acciones atómicas y específicas que se pueden ejecutar en la plataforma
CREATE TABLE `permisos` (
    `id_permiso` int(11) NOT NULL AUTO_INCREMENT,
    `nombre_permiso` varchar(100) NOT NULL UNIQUE,
    PRIMARY KEY (`id_permiso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla intermedia 'rol_permisos': Rompe la relación muchos a muchos asignando permisos a cada rol
CREATE TABLE `rol_permisos` (
    `id_rol` int(11) NOT NULL,
    `id_permiso` int(11) NOT NULL,
    PRIMARY KEY (`id_rol`, `id_permiso`),
    CONSTRAINT `fk_rp_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE,
    CONSTRAINT `fk_rp_permiso` FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id_permiso`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserción de ejemplo de permisos básicos del sistema
-- ============================================================
-- CARGA DE PERMISOS FALTANTES PARA GESTION_TECNICA2
-- ============================================================

-- ============================================================
-- 1. CARGA DEL CATÁLOGO DE PERMISOS
-- ============================================================
INSERT IGNORE INTO `permisos` (`nombre_permiso`) VALUES
-- Alumno
('alumno_ver_perfil'), ('alumno_ver_horario'), ('alumno_ver_mis_notas'), ('alumno_ver_mis_asistencias'), ('alumno_ver_mi_curso'),

-- Delegado
('delegado_crear_noticia'), ('delegado_editar_mis_noticias'), ('delegado_eliminar_mis_noticias'),

-- Profesor
('profesor_ver_curso'), ('profesor_ver_alumnos_de_curso'), ('profesor_ver_perfil_alumno'), ('profesor_ver_todos_notas'),('profesor_crear_nota'),('profesor_editar_nota'),('profesor_eliminar_nota'), ('profesor_gestionar_asistencias'), ('profesor_ver_horario'),

-- Preceptor
('preceptor_ver_curso'), ('preceptor_ver_alumnos_de_curso'), ('preceptor_ver_perfil_alumno'), ('preceptor_registrar_asistencias'), ('preceptor_ver_asistencias'), ('preceptor_gestionar_sanciones'), ('preceptor_ver_sanciones'),

-- Bibliotecario
('biblio_ver_recursos'), ('biblio_crear_recurso'), ('biblio_editar_recurso'), ('biblio_eliminar_recurso'), ('biblio_gestionar_inventario'), ('biblio_crear_prestamo'), ('biblio_editar_prestamo'), ('biblio_ver_prestamos'), ('biblio_registrar_devolucion'),

-- Padre / Tutor
('tutor_ver_perfil_hijo'), ('tutor_ver_notas_hijo'), ('tutor_ver_asistencias_hijo'), ('tutor_ver_sanciones_hijo'), ('tutor_ver_calendario'),

-- Administrativo
('administrativo_ver_todos_alumnos'), ('administrativo_crear_alumno'), ('administrativo_editar_alumno'), ('administrativo_eliminar_alumno'),
('administrativo_ver_todos_cursos'),('administrativo_crear_curso'),('administrativo_editar_curso'),('administrativo_eliminar_curso'),
('administrativo_crear_usuario'), ('administrativo_editar_usuario'), ('administrativo_eliminar_usuario'),
('administrativo_asignar_rol'), ('administrativo_ver_reportes'),
('administrativo_ver_todos_profesores'),('administrativo_crear_profesor'),('administrativo_editar_profesor'),('administrativo_eliminar_profesor'),
('administrativo_ver_todos_asignaciones'),('administrativo_crear_asignacion'),('administrativo_editar_asignacion'),('administrativo_eliminar_asignacion'),
('administrativo_ver_todos_materias'),('administrativo_crear_materia'),('administrativo_editar_materia'),('administrativo_eliminar_materia'),
-- Admin / Root
('root_gestionar_roles'), ('root_gestionar_permisos'), ('root_ver_logs_sistema'), ('root_configurar_sistema'), ('root_eliminar_cualquier_contenido');

-- ============================================================
-- 2. ASIGNACIÓN DE PERMISOS A CADA ROL
-- ============================================================

-- ALUMNO (id_rol = 1)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 1, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'alumno_ver_perfil', 'alumno_ver_horario', 'alumno_ver_mis_notas', 'alumno_ver_mis_asistencias', 'alumno_ver_mi_curso'
);

-- DELEGADO (id_rol = 2)
-- Hereda lo del alumno + sus permisos específicos
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 2, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'alumno_ver_perfil', 'alumno_ver_horario', 'alumno_ver_mis_notas', 'alumno_ver_mis_asistencias', 'alumno_ver_mi_curso',
    'delegado_crear_noticia', 'delegado_editar_mis_noticias', 'delegado_eliminar_mis_noticias'
);

-- PROFESOR (id_rol = 3)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 3, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
'profesor_ver_curso', 'profesor_ver_alumnos_de_curso', 'profesor_ver_perfil_alumno',
'profesor_ver_todos_notas','profesor_crear_nota','profesor_editar_nota','profesor_eliminar_nota',
'profesor_gestionar_asistencias', 'profesor_ver_horario'
);

-- PRECEPTOR (id_rol = 4)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 4, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'preceptor_ver_curso', 'preceptor_ver_alumnos_de_curso', 'preceptor_ver_perfil_alumno', 'preceptor_registrar_asistencias', 'preceptor_ver_asistencias', 'preceptor_gestionar_sanciones', 'preceptor_ver_sanciones'
);

-- BIBLIOTECARIO (id_rol = 5)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 5, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'biblio_ver_recursos', 'biblio_crear_recurso', 'biblio_editar_recurso', 'biblio_eliminar_recurso', 'biblio_gestionar_inventario', 'biblio_crear_prestamo', 'biblio_editar_prestamo', 'biblio_ver_prestamos', 'biblio_registrar_devolucion'
);

-- PADRE / TUTOR (id_rol = 6)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 6, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'tutor_ver_perfil_hijo', 'tutor_ver_notas_hijo', 'tutor_ver_asistencias_hijo', 'tutor_ver_sanciones_hijo', 'tutor_ver_calendario'
);

-- ADMINISTRATIVO (id_rol = 8)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 8, id_permiso
FROM `permisos`
WHERE `nombre_permiso` IN (
  'administrativo_ver_todos_alumnos', 'administrativo_crear_alumno', 'administrativo_editar_alumno', 'administrativo_eliminar_alumno',
  'administrativo_ver_todos_cursos', 'administrativo_crear_curso', 'administrativo_editar_curso', 'administrativo_eliminar_curso',
  'administrativo_crear_usuario', 'administrativo_editar_usuario', 'administrativo_eliminar_usuario',
  'administrativo_asignar_rol', 'administrativo_ver_reportes',
  'administrativo_ver_todos_profesores', 'administrativo_crear_profesor', 'administrativo_editar_profesor', 'administrativo_eliminar_profesor',
  'administrativo_ver_todos_asignaciones', 'administrativo_crear_asignacion','administrativo_editar_asignacion','administrativo_eliminar_asignacion',
  'administrativo_ver_todos_materias','administrativo_crear_materia','administrativo_editar_materia','administrativo_eliminar_materia'
  );

-- ADMIN / ROOT (id_rol = 9)
-- El "Dios" del sistema: en lugar de hacer un IN() gigante, le pasamos TODOS los permisos que existen en la tabla.
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 9, id_permiso FROM `permisos`;
-- ============================================================
-- ENTIDAD CENTRAL DE AUTENTICACIÓN
-- ============================================================

-- Tabla 'usuarios': Almacena las credenciales globales de acceso e información de identidad general
CREATE TABLE `usuarios` (
    `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `contrasena` varchar(255) NOT NULL,
    `id_rol` int(11) NOT NULL,
    PRIMARY KEY (`id_usuario`),
    UNIQUE KEY `email` (`email`),
    KEY `id_rol` (`id_rol`),
    CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- MÓDULO ESTRUCTURA ACADÉMICA
-- ============================================================

-- Tabla 'cursos': Registro de divisiones académicas, sus turnos horarios y la asignación física de aulas
CREATE TABLE `cursos` (
    `id_curso` int(11) NOT NULL AUTO_INCREMENT,
    `nombre_curso` varchar(50) NOT NULL,
    `turno` varchar(50) NOT NULL,
    `aula` varchar(20) NOT NULL,
    PRIMARY KEY (`id_curso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla 'alumnos': Almacena el padrón de estudiantes vinculado a un curso y enlazado opcionalmente a un usuario
CREATE TABLE `alumnos` (
    `id_alumno` int(11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `dni` varchar(20) NOT NULL,
    `id_curso` int(11) NOT NULL,
    `id_usuario` int(11) DEFAULT NULL,
    PRIMARY KEY (`id_alumno`),
    UNIQUE KEY `dni_unico` (`dni`),
    UNIQUE KEY `uq_alumnos_usuario` (`id_usuario`),
    KEY `id_curso` (`id_curso`),
    CONSTRAINT `alumnos_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`),
    CONSTRAINT `alumnos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla 'profesores': Registro del cuerpo docente de la institución y su respectivo enlace de login
CREATE TABLE `profesores` (
    `id_profesor` int(11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `id_usuario` int(11) DEFAULT NULL,
    PRIMARY KEY (`id_profesor`),
    UNIQUE KEY `email_profesor` (`email`),
    UNIQUE KEY `uq_profesores_usuario` (`id_usuario`),
    CONSTRAINT `profesores_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla 'materias': Listado global de asignaturas curriculares dictadas en el establecimiento
CREATE TABLE `materias` (
    `id_materia` int(11) NOT NULL AUTO_INCREMENT,
    `nombre_materia` varchar(100) NOT NULL,
    PRIMARY KEY (`id_materia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla 'asignaciones': Relación ternaria que une un Curso, una Materia y el Profesor asignado a dictarla
CREATE TABLE `asignaciones` (
    `id_asignacion` int(11) NOT NULL AUTO_INCREMENT,
    `id_curso` int(11) NOT NULL,
    `id_materia` int(11) NOT NULL,
    `id_profesor` int(11) NOT NULL,
    PRIMARY KEY (`id_asignacion`),
    CONSTRAINT `fk_asig_curso` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`),
    CONSTRAINT `fk_asig_materia` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id_materia`),
    CONSTRAINT `fk_asig_profesor` FOREIGN KEY (`id_profesor`) REFERENCES `profesores` (`id_profesor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEGUIMIENTO ACADÉMICO Y EVALUACIONES
-- ============================================================

-- Tabla 'notas': Almacena las calificaciones individuales de los alumnos asociadas a cada asignación docente
CREATE TABLE `notas` (
    `id_nota` int(11) NOT NULL AUTO_INCREMENT,
    `id_alumno` int(11) NOT NULL,
    `id_asignacion` int(11) NOT NULL,
    `calificacion` decimal(3,1) NOT NULL CHECK (`calificacion` >= 0.0 AND `calificacion` <= 10.0),
    `fecha_carga` date NOT NULL,
    `observaciones` text DEFAULT NULL,
    PRIMARY KEY (`id_nota`),
    CONSTRAINT `fk_nota_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`),
    CONSTRAINT `fk_nota_asig` FOREIGN KEY (`id_asignacion`) REFERENCES `asignaciones` (`id_asignacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- AUTORIDADES INSTITUCIONALES Y ASISTENCIA DAILY
-- ============================================================

-- Tabla 'autoridades': Miembros directivos y administrativos de alto rango a cargo de la gestión escolar
CREATE TABLE `autoridades` (
    `id_autoridad` int(11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `cargo` varchar(80) NOT NULL,
    `email` varchar(100) NOT NULL,
    `id_usuario` int(11) DEFAULT NULL,
    PRIMARY KEY (`id_autoridad`),
    UNIQUE KEY `email_autoridad` (`email`),
    UNIQUE KEY `uq_autoridades_usuario` (`id_usuario`),
    CONSTRAINT `autoridades_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla 'asistencias': Registro periódico de presentismo estudiantil filtrado por alumno, curso y fecha
CREATE TABLE `asistencias` (
    `id_asistencia` int(11) NOT NULL AUTO_INCREMENT,
    `id_alumno` int(11) NOT NULL,
    `id_curso` int(11) NOT NULL,
    `fecha` date NOT NULL,
    `estado` ENUM('presente', 'ausente', 'justificado', 'tardanza') NOT NULL,
    PRIMARY KEY (`id_asistencia`),
    UNIQUE KEY `uq_asis_dia` (`id_alumno`, `fecha`),
    KEY `id_alumno` (`id_alumno`),
    KEY `id_curso` (`id_curso`),
    CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`),
    CONSTRAINT `asistencias_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- MÓDULO DE BIBLIOTECA E INVENTARIO DE RECURSOS
-- ============================================================

-- Tabla 'biblioteca': Ubicaciones o sectores de consulta literaria dentro del establecimiento y sus encargados
CREATE TABLE `biblioteca` (
    `id_biblioteca` int(11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `ubicacion` varchar(100) NOT NULL,
    `responsable` int(11) NOT NULL,
    PRIMARY KEY (`id_biblioteca`),
    KEY `responsable` (`responsable`),
    CONSTRAINT `biblioteca_ibfk_1` FOREIGN KEY (`responsable`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla 'recursos': Inventario físico disponible en la biblioteca (libros, tecnología, equipamiento)
CREATE TABLE `recursos` (
    `id_recurso` int(11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `tipo` varchar(50) NOT NULL,
    `descripcion` text DEFAULT NULL,
    `estado` ENUM('disponible', 'prestado', 'dañado', 'baja') NOT NULL DEFAULT 'disponible',
    `id_biblioteca` int(11) NOT NULL,
    PRIMARY KEY (`id_recurso`),
    KEY `id_biblioteca` (`id_biblioteca`),
    CONSTRAINT `recursos_ibfk_1` FOREIGN KEY (`id_biblioteca`) REFERENCES `biblioteca` (`id_biblioteca`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla 'prestamos': Bitácora transaccional para el control de los recursos retirados temporalmente por los usuarios
CREATE TABLE `prestamos` (
    `id_prestamo` int(11) NOT NULL AUTO_INCREMENT,
    `id_recurso` int(11) NOT NULL,
    `id_usuario` int(11) NOT NULL,
    `fecha_prestamo` date NOT NULL,
    `fecha_devolucion` date DEFAULT NULL,
    `estado` ENUM('activo', 'devuelto', 'vencido') NOT NULL DEFAULT 'activo',
    PRIMARY KEY (`id_prestamo`),
    KEY `id_recurso` (`id_recurso`),
    KEY `id_usuario` (`id_usuario`),
    CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`id_recurso`) REFERENCES `recursos` (`id_recurso`),
    CONSTRAINT `prestamos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- MÓDULO COMUNIDAD (COMUNICADOS Y HALLAZGOS)
-- ============================================================

-- Registro de hallazgos
CREATE TABLE `objetos_perdidos` (
    `id_objeto` int(11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `descripcion` text DEFAULT NULL,
    `fecha_encontrado` date NOT NULL,
    `encontrado_por` int(11) DEFAULT NULL,
    `estado` ENUM('perdido', 'encontrado', 'reclamado') NOT NULL,

    PRIMARY KEY (`id_objeto`),
    KEY `encontrado_por` (`encontrado_por`),
    CONSTRAINT `fk_objeto_autoridad` FOREIGN KEY (`encontrado_por`) REFERENCES `autoridades` (`id_autoridad`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Estructura de tabla para la tabla comunicados
CREATE TABLE comunicados (
  `id_comunicado` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `importancia` enum('baja', 'media', 'alta') NOT NULL DEFAULT 'media',
  `destino` enum('todos', 'profesores', 'alumnos', 'autoridades') NOT NULL DEFAULT 'todos',
  `fecha_publicacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `autor_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_comunicado`),
  KEY `autor_id` (`autor_id`),
  CONSTRAINT `fk_comunicado_autor` FOREIGN KEY (`autor_id`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Cartelera de anuncios
CREATE TABLE `noticias` (
    `id_noticia` int(11) NOT NULL AUTO_INCREMENT,
    `titulo` varchar(200) NOT NULL,
    `contenido` text NOT NULL,
    `fecha` date NOT NULL,
    `autor_id` int(11) DEFAULT NULL,
    `imagen` varchar(255) DEFAULT NULL,
    `imagen_path` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id_noticia`),
    KEY `autor_id` (`autor_id`),
    CONSTRAINT `fk_noticia_autor` FOREIGN KEY (`autor_id`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- ÍNDICES DE OPTIMIZACIÓN
-- ============================================================

CREATE INDEX `idx_notas_alumno` ON `notas` (`id_alumno`);
CREATE INDEX `idx_asignacion_curso` ON `asignaciones` (`id_curso`);
CREATE INDEX `idx_asistencias_fecha` ON `asistencias` (`fecha`);
CREATE INDEX `idx_prestamos_estado` ON `prestamos` (`estado`);
CREATE INDEX `idx_recursos_estado` ON `recursos` (`estado`);
CREATE INDEX `idx_objetos_estado` ON `objetos_perdidos` (`estado`);

-- Cierre exitoso y persistencia de todos los cambios de la transacción actual en el almacenamiento
COMMIT;
