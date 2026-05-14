-- ============================================================
--  Base de datos: gestion_tecnica2
--  Versión: actualizada según diagrama gestion_tecnica2
--  Nombres de tablas y columnas respetados del SQL original
--  Motor: MySQL 8+ / MariaDB 10.5+
-- ============================================================
SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET
  time_zone = "+00:00";

DROP DATABASE IF EXISTS gestion_tecnica2;

CREATE DATABASE gestion_tecnica2 CHARACTER
SET
  utf8mb4 COLLATE utf8mb4_general_ci;

USE gestion_tecnica2;

-- ============================================================
-- TABLAS BASE (sin dependencias)
-- ============================================================
-- ------------------------------------------------------------
-- roles  (sin cambios respecto al original)
-- ------------------------------------------------------------
CREATE TABLE
  `roles` (
    `id_rol` int (11) NOT NULL AUTO_INCREMENT,
    `nombre_rol` varchar(50) NOT NULL,
    PRIMARY KEY (`id_rol`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

INSERT INTO
  `roles` (`id_rol`, `nombre_rol`)
VALUES
  (1, 'admin'),
  (2, 'profesor'),
  (3, 'alumno'),
  (4, 'bibliotecario'),
  (5, 'delegado');

-- ------------------------------------------------------------
-- usuarios
--   CAMBIO: renombrado contraseña → contrasena (elimina tilde
--           para evitar errores en drivers/ORMs)
-- ------------------------------------------------------------
CREATE TABLE
  `usuarios` (
    `id_usuario` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `contrasena` varchar(255) NOT NULL, -- sin tilde
    `id_rol` int (11) NOT NULL,
    PRIMARY KEY (`id_usuario`),
    UNIQUE KEY `email` (`email`),
    KEY `id_rol` (`id_rol`),
    CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ------------------------------------------------------------
-- cursos  (sin cambios)
-- ------------------------------------------------------------
CREATE TABLE
  `cursos` (
    `id_curso` int (11) NOT NULL AUTO_INCREMENT,
    `nombre_curso` varchar(50) NOT NULL,
    `turno` varchar(50) NOT NULL,
    `aula` varchar(20) NOT NULL,
    PRIMARY KEY (`id_curso`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ============================================================
-- TABLAS QUE EXTIENDEN usuarios (herencia)
-- ============================================================
-- ------------------------------------------------------------
-- alumnos
--   CAMBIO: agregado id_usuario (FK → usuarios) para vincular
--           al alumno con el sistema de login
-- ------------------------------------------------------------
CREATE TABLE
  `alumnos` (
    `id_alumno` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `dni` varchar(20) NOT NULL,
    `id_curso` int (11) NOT NULL,
    `id_usuario` int (11) DEFAULT NULL, -- nuevo: login del alumno
    PRIMARY KEY (`id_alumno`),
    UNIQUE KEY `dni_unico` (`dni`),
    UNIQUE KEY `uq_alumnos_usuario` (`id_usuario`),
    KEY `id_curso` (`id_curso`),
    CONSTRAINT `alumnos_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`),
    CONSTRAINT `alumnos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ------------------------------------------------------------
-- profesores
--   CAMBIO: agregado id_usuario (FK → usuarios) para vincular
--           al profesor con el sistema de login
-- ------------------------------------------------------------
CREATE TABLE
  `profesores` (
    `id_profesor` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `materia` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `id_usuario` int (11) DEFAULT NULL, -- nuevo: login del profesor
    PRIMARY KEY (`id_profesor`),
    UNIQUE KEY `email_profesor` (`email`),
    UNIQUE KEY `uq_profesores_usuario` (`id_usuario`),
    CONSTRAINT `profesores_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ------------------------------------------------------------
-- autoridades  (tabla nueva del diagrama)
--   NOTA: cargo aparece como FK en el diagrama pero no existe
--         tabla de cargos → se mantiene como VARCHAR para
--         respetar el diagrama sin agregar tablas no pedidas
-- ------------------------------------------------------------
CREATE TABLE
  `autoridades` (
    `id_autoridad` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `cargo` varchar(80) NOT NULL, -- Director, Vicedirector, etc.
    `email` varchar(100) NOT NULL,
    `id_usuario` int (11) DEFAULT NULL,
    PRIMARY KEY (`id_autoridad`),
    UNIQUE KEY `email_autoridad` (`email`),
    UNIQUE KEY `uq_autoridades_usuario` (`id_usuario`),
    CONSTRAINT `autoridades_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ============================================================
-- MÓDULO ACADÉMICO
-- ============================================================
-- ------------------------------------------------------------
-- asistencias
--   CAMBIO 1: agregado id_curso (FK → cursos) — saber a qué
--             clase pertenece cada asistencia
--   CAMBIO 2: UNIQUE (id_alumno, fecha) — evita duplicados
--   CAMBIO 3: estado pasa a ENUM con valores controlados
-- ------------------------------------------------------------
CREATE TABLE
  `asistencias` (
    `id_asistencia` int (11) NOT NULL AUTO_INCREMENT,
    `id_alumno` int (11) NOT NULL,
    `id_curso` int (11) NOT NULL, -- nuevo
    `fecha` date NOT NULL,
    `estado` ENUM ('presente', 'ausente', 'justificado', 'tardanza') NOT NULL,
    PRIMARY KEY (`id_asistencia`),
    UNIQUE KEY `uq_asis_dia` (`id_alumno`, `fecha`), -- nuevo
    KEY `id_alumno` (`id_alumno`),
    KEY `id_curso` (`id_curso`),
    CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`),
    CONSTRAINT `asistencias_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ============================================================
-- MÓDULO BIBLIOTECA
-- ============================================================
-- ------------------------------------------------------------
-- biblioteca  (sin cambios en columnas)
-- ------------------------------------------------------------
CREATE TABLE
  `biblioteca` (
    `id_biblioteca` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `ubicacion` varchar(100) NOT NULL,
    `responsable` int (11) NOT NULL,
    PRIMARY KEY (`id_biblioteca`),
    KEY `responsable` (`responsable`),
    CONSTRAINT `biblioteca_ibfk_1` FOREIGN KEY (`responsable`) REFERENCES `usuarios` (`id_usuario`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ------------------------------------------------------------
-- recursos
--   CAMBIO: estado pasa a ENUM con valores controlados
-- ------------------------------------------------------------
CREATE TABLE
  `recursos` (
    `id_recurso` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `tipo` varchar(50) NOT NULL,
    `descripcion` text DEFAULT NULL,
    `estado` ENUM ('disponible', 'prestado', 'dañado', 'baja') NOT NULL DEFAULT 'disponible',
    `id_biblioteca` int (11) NOT NULL,
    PRIMARY KEY (`id_recurso`),
    KEY `id_biblioteca` (`id_biblioteca`),
    CONSTRAINT `recursos_ibfk_1` FOREIGN KEY (`id_biblioteca`) REFERENCES `biblioteca` (`id_biblioteca`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ------------------------------------------------------------
-- prestamos
--   CAMBIO: estado pasa a ENUM con valores controlados
-- ------------------------------------------------------------
CREATE TABLE
  `prestamos` (
    `id_prestamo` int (11) NOT NULL AUTO_INCREMENT,
    `id_recurso` int (11) NOT NULL,
    `id_usuario` int (11) NOT NULL,
    `fecha_prestamo` date NOT NULL,
    `fecha_devolucion` date DEFAULT NULL,
    `estado` ENUM ('activo', 'devuelto', 'vencido') NOT NULL DEFAULT 'activo',
    PRIMARY KEY (`id_prestamo`),
    KEY `id_recurso` (`id_recurso`),
    KEY `id_usuario` (`id_usuario`),
    CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`id_recurso`) REFERENCES `recursos` (`id_recurso`),
    CONSTRAINT `prestamos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ============================================================
-- MÓDULO SERVICIOS INSTITUCIONALES (tablas nuevas del diagrama)
-- ============================================================
-- ------------------------------------------------------------
-- objetos_perdidos  (nueva)
--   encontrado_por FK → autoridades (según línea del diagrama)
-- ------------------------------------------------------------
CREATE TABLE
  `objetos_perdidos` (
    `id_objeto` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `descripcion` text DEFAULT NULL,
    `fecha_encontrado` date NOT NULL,
    `encontrado_por` int (11) DEFAULT NULL,
    `reclamado` tinyint (1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id_objeto`),
    KEY `encontrado_por` (`encontrado_por`),
    CONSTRAINT `objetos_perdidos_ibfk_1` FOREIGN KEY (`encontrado_por`) REFERENCES `autoridades` (`id_autoridad`) ON DELETE SET NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ------------------------------------------------------------
-- noticias  (nueva)
--   autor FK → usuarios (campo llamado "autor" según diagrama)
-- ------------------------------------------------------------
CREATE TABLE
  `noticias` (
    `id_noticia` int (11) NOT NULL AUTO_INCREMENT,
    `titulo` varchar(200) NOT NULL,
    `contenido` text NOT NULL,
    `fecha` date NOT NULL,
    `autor` int (11) DEFAULT NULL,
    PRIMARY KEY (`id_noticia`),
    KEY `autor` (`autor`),
    CONSTRAINT `noticias_ibfk_1` FOREIGN KEY (`autor`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- ============================================================
-- ÍNDICES ADICIONALES (rendimiento en consultas frecuentes)
-- ============================================================
CREATE INDEX `idx_asistencias_fecha` ON `asistencias` (`fecha`);

CREATE INDEX `idx_prestamos_estado` ON `prestamos` (`estado`);

CREATE INDEX `idx_recursos_estado` ON `recursos` (`estado`);

CREATE INDEX `idx_objetos_reclamado` ON `objetos_perdidos` (`reclamado`);

COMMIT;

-- ============================================================
-- RESUMEN DE CAMBIOS RESPECTO AL SQL ORIGINAL
-- ============================================================
--
--  RENOMBRADO:
--    usuarios.contraseña  →  usuarios.contrasena  (elimina tilde)
--
--  COLUMNAS AGREGADAS:
--    alumnos.id_usuario    FK → usuarios
--    profesores.id_usuario FK → usuarios
--    asistencias.id_curso  FK → cursos
--
--  TIPOS CORREGIDOS (VARCHAR → ENUM):
--    asistencias.estado    presente|ausente|justificado|tardanza
--    recursos.estado       disponible|prestado|dañado|baja
--    prestamos.estado      activo|devuelto|vencido
--
--  CONSTRAINTS NUEVOS:
--    asistencias: UNIQUE (id_alumno, fecha)
--
--  TABLAS NUEVAS (del diagrama):
--    autoridades      (id_autoridad, nombre, apellido, cargo, email, id_usuario)
--    objetos_perdidos (id_objeto, nombre, descripcion, fecha_encontrado,
--                      encontrado_por, reclamado)
--    noticias         (id_noticia, titulo, contenido, fecha, autor)
--
--  SIN CAMBIOS:
--    roles, cursos, biblioteca, prestamos (estructura)
--
-- ============================================================