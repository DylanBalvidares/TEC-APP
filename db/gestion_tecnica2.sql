-- phpMyAdmin SQL Dump Actualizado
-- Proyecto: tec-app-gestion
SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET
  time_zone = "+00:00";

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `roles`
-- (Se crea primero para evitar errores de FK)
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `usuarios`
-- --------------------------------------------------------
CREATE TABLE
  `usuarios` (
    `id_usuario` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `contraseña` varchar(255) NOT NULL,
    `id_rol` int (11) NOT NULL,
    PRIMARY KEY (`id_usuario`),
    UNIQUE KEY `email` (`email`),
    KEY `id_rol` (`id_rol`),
    CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `cursos`
-- --------------------------------------------------------
CREATE TABLE
  `cursos` (
    `id_curso` int (11) NOT NULL AUTO_INCREMENT,
    `nombre_curso` varchar(50) NOT NULL,
    `turno` varchar(50) NOT NULL,
    `aula` varchar(20) NOT NULL,
    PRIMARY KEY (`id_curso`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `alumnos`
-- --------------------------------------------------------
CREATE TABLE
  `alumnos` (
    `id_alumno` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `dni` varchar(20) NOT NULL,
    `id_curso` int (11) NOT NULL,
    PRIMARY KEY (`id_alumno`),
    UNIQUE KEY `dni_unico` (`dni`),
    KEY `id_curso` (`id_curso`),
    CONSTRAINT `alumnos_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id_curso`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `profesores`
-- --------------------------------------------------------
CREATE TABLE
  `profesores` (
    `id_profesor` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `apellido` varchar(100) NOT NULL,
    `materia` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    PRIMARY KEY (`id_profesor`),
    UNIQUE KEY `email_profesor` (`email`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `asistencias`
-- --------------------------------------------------------
CREATE TABLE
  `asistencias` (
    `id_asistencia` int (11) NOT NULL AUTO_INCREMENT,
    `id_alumno` int (11) NOT NULL,
    `fecha` date NOT NULL,
    `estado` varchar(20) NOT NULL,
    PRIMARY KEY (`id_asistencia`),
    KEY `id_alumno` (`id_alumno`),
    CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `biblioteca`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `recursos`
-- --------------------------------------------------------
CREATE TABLE
  `recursos` (
    `id_recurso` int (11) NOT NULL AUTO_INCREMENT,
    `nombre` varchar(100) NOT NULL,
    `tipo` varchar(50) NOT NULL,
    `descripcion` text DEFAULT NULL, -- Opcional
    `estado` varchar(50) NOT NULL,
    `id_biblioteca` int (11) NOT NULL,
    PRIMARY KEY (`id_recurso`),
    KEY `id_biblioteca` (`id_biblioteca`),
    CONSTRAINT `recursos_ibfk_1` FOREIGN KEY (`id_biblioteca`) REFERENCES `biblioteca` (`id_biblioteca`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `prestamos`
-- --------------------------------------------------------
CREATE TABLE
  `prestamos` (
    `id_prestamo` int (11) NOT NULL AUTO_INCREMENT,
    `id_recurso` int (11) NOT NULL,
    `id_usuario` int (11) NOT NULL,
    `fecha_prestamo` date NOT NULL,
    `fecha_devolucion` date DEFAULT NULL, -- Nulo hasta que se devuelva
    `estado` varchar(50) NOT NULL,
    PRIMARY KEY (`id_prestamo`),
    KEY `id_recurso` (`id_recurso`),
    KEY `id_usuario` (`id_usuario`),
    CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`id_recurso`) REFERENCES `recursos` (`id_recurso`),
    CONSTRAINT `prestamos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

COMMIT;