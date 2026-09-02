-- ============================================================
--  Base de datos: gestion_tecnica2
--  Versión: corregida
--  Correcciones aplicadas:
--    - objetos_perdidos.encontrado_por → personal (era autoridades, tabla inexistente)
--    - cargos y personal: agregado ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
--    - Eliminado rol 'invitado' (las rutas públicas se manejan en el gateway)
--    - Agregada tabla sanciones (requerida por preceptor_gestionar_sanciones)
--    - Agregada tabla tutores_alumnos (requerida por tutor_ver_*_hijo)
--    - asistencias: agregado registrado_por FK → usuarios
--    - cursos.nivel: VARCHAR → ENUM
--    - comunicados: agregados permisos para administrativo y root
--    - administrativo renombrado a 'administrativo' (era 'admin' en versiones anteriores)
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

DROP DATABASE IF EXISTS gestion_tecnica2;
CREATE DATABASE gestion_tecnica2 CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE gestion_tecnica2;

-- ============================================================
-- RBAC — ROLES
-- ============================================================

CREATE TABLE `roles` (
    `id_rol`     int(11)     NOT NULL AUTO_INCREMENT,
    `nombre_rol` varchar(50) NOT NULL,
    PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CORRECCIÓN: eliminado 'invitado' (id_rol=7) — rutas públicas = gateway
INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES
    (1, 'alumno'),
    (2, 'delegado'),
    (3, 'profesor'),
    (4, 'preceptor'),
    (5, 'bibliotecario'),
    (6, 'tutor'),
    (7, 'administrativo'),
    (8, 'root');

-- ============================================================
-- RBAC — PERMISOS
-- ============================================================

CREATE TABLE `permisos` (
    `id_permiso`     int(11)      NOT NULL AUTO_INCREMENT,
    `nombre_permiso` varchar(100) NOT NULL,
    PRIMARY KEY (`id_permiso`),
    UNIQUE KEY `uq_permiso` (`nombre_permiso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `permisos` (`nombre_permiso`) VALUES
    -- Alumno
    ('alumno_ver_perfil'),
    ('alumno_ver_horario'),
    ('alumno_ver_mis_notas'),
    ('alumno_ver_mis_asistencias'),
    ('alumno_ver_mi_curso'),
    -- Delegado
    ('delegado_crear_noticia'),
    ('delegado_editar_mis_noticias'),
    ('delegado_eliminar_mis_noticias'),
    -- Profesor
    ('profesor_ver_curso'),
    ('profesor_ver_alumnos_de_curso'),
    ('profesor_ver_perfil_alumno'),
    ('profesor_ver_todos_notas'),
    ('profesor_crear_nota'),
    ('profesor_editar_nota'),
    ('profesor_eliminar_nota'),
    ('profesor_gestionar_asistencias'),
    ('profesor_ver_horario'),
    -- Preceptor
    ('preceptor_ver_curso'),
    ('preceptor_ver_alumnos_de_curso'),
    ('preceptor_ver_perfil_alumno'),
    ('preceptor_registrar_asistencias'),
    ('preceptor_ver_asistencias'),
    ('preceptor_gestionar_sanciones'),
    ('preceptor_ver_sanciones'),
    ('preceptor_enviar_email_alumno'),
    -- Preceptor nuevos
    ('preceptor_crear_alumno'),
    ('preceptor_editar_alumno'),
    ('preceptor_eliminar_alumno'),
    -- Bibliotecario
    ('biblio_ver_recursos'),
    ('biblio_crear_recurso'),
    ('biblio_editar_recurso'),
    ('biblio_eliminar_recurso'),
    ('biblio_gestionar_inventario'),
    ('biblio_crear_prestamo'),
    ('biblio_editar_prestamo'),
    ('biblio_ver_prestamos'),
    ('biblio_registrar_devolucion'),
    -- Tutor
    ('tutor_ver_perfil_hijo'),
    ('tutor_ver_notas_hijo'),
    ('tutor_ver_asistencias_hijo'),
    ('tutor_ver_sanciones_hijo'),
    ('tutor_ver_calendario'),
    -- Administrativo
    ('administrativo_ver_todos_alumnos'),
    ('administrativo_crear_alumno'),
    ('administrativo_editar_alumno'),
    ('administrativo_eliminar_alumno'),
    ('administrativo_ver_todos_cursos'),
    ('administrativo_crear_curso'),
    ('administrativo_editar_curso'),
    ('administrativo_eliminar_curso'),
    ('administrativo_crear_usuario'),
    ('administrativo_editar_usuario'),
    ('administrativo_eliminar_usuario'),
    ('administrativo_asignar_rol'),
    ('administrativo_ver_reportes'),
    ('administrativo_ver_todos_profesores'),
    ('administrativo_crear_profesor'),
    ('administrativo_editar_profesor'),
    ('administrativo_eliminar_profesor'),
    ('administrativo_ver_todos_asignaciones'),
    ('administrativo_crear_asignacion'),
    ('administrativo_editar_asignacion'),
    ('administrativo_eliminar_asignacion'),
    ('administrativo_ver_todos_materias'),
    ('administrativo_crear_materia'),
    ('administrativo_editar_materia'),
    ('administrativo_eliminar_materia'),
    -- Comunicados (nuevo)
    ('comunicado_crear'),
    ('comunicado_editar'),
    ('comunicado_eliminar'),
    ('comunicado_ver'),
    -- Root
    ('root_gestionar_roles'),
    ('root_gestionar_permisos'),
    ('root_ver_logs_sistema'),
    ('root_configurar_sistema'),
    ('root_eliminar_cualquier_contenido');

-- ============================================================
-- RBAC — ROL_PERMISOS
-- ============================================================

CREATE TABLE `rol_permisos` (
    `id_rol`     int(11) NOT NULL,
    `id_permiso` int(11) NOT NULL,
    PRIMARY KEY (`id_rol`, `id_permiso`),
    CONSTRAINT `fk_rp_rol`     FOREIGN KEY (`id_rol`)     REFERENCES `roles`   (`id_rol`)     ON DELETE CASCADE,
    CONSTRAINT `fk_rp_permiso` FOREIGN KEY (`id_permiso`) REFERENCES `permisos`(`id_permiso`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Alumno (id_rol=1)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 1, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'alumno_ver_perfil','alumno_ver_horario','alumno_ver_mis_notas',
    'alumno_ver_mis_asistencias','alumno_ver_mi_curso'
);

-- Delegado (id_rol=2): hereda alumno + propios
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 2, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'alumno_ver_perfil','alumno_ver_horario','alumno_ver_mis_notas',
    'alumno_ver_mis_asistencias','alumno_ver_mi_curso',
    'delegado_crear_noticia','delegado_editar_mis_noticias','delegado_eliminar_mis_noticias'
);

-- Profesor (id_rol=3)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 3, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'profesor_ver_curso','profesor_ver_alumnos_de_curso','profesor_ver_perfil_alumno',
    'profesor_ver_todos_notas','profesor_crear_nota','profesor_editar_nota',
    'profesor_eliminar_nota','profesor_gestionar_asistencias','profesor_ver_horario'
);

-- Preceptor (id_rol=4)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 4, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'preceptor_ver_curso','preceptor_ver_alumnos_de_curso','preceptor_ver_perfil_alumno',
    'preceptor_registrar_asistencias','preceptor_ver_asistencias',
    'preceptor_gestionar_sanciones','preceptor_ver_sanciones',
    'preceptor_crear_alumno','preceptor_editar_alumno','preceptor_eliminar_alumno',
    'preceptor_enviar_email_alumno'
);

-- Bibliotecario (id_rol=5)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 5, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'biblio_ver_recursos','biblio_crear_recurso','biblio_editar_recurso',
    'biblio_eliminar_recurso','biblio_gestionar_inventario','biblio_crear_prestamo',
    'biblio_editar_prestamo','biblio_ver_prestamos','biblio_registrar_devolucion'
);

-- Tutor (id_rol=6)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 6, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'tutor_ver_perfil_hijo','tutor_ver_notas_hijo','tutor_ver_asistencias_hijo',
    'tutor_ver_sanciones_hijo','tutor_ver_calendario'
);

-- Administrativo (id_rol=7)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 7, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'administrativo_ver_todos_alumnos','administrativo_crear_alumno',
    'administrativo_editar_alumno','administrativo_eliminar_alumno',
    'administrativo_ver_todos_cursos','administrativo_crear_curso',
    'administrativo_editar_curso','administrativo_eliminar_curso',
    'administrativo_crear_usuario','administrativo_editar_usuario',
    'administrativo_eliminar_usuario','administrativo_asignar_rol',
    'administrativo_ver_reportes','administrativo_ver_todos_profesores',
    'administrativo_crear_profesor','administrativo_editar_profesor',
    'administrativo_eliminar_profesor','administrativo_ver_todos_asignaciones',
    'administrativo_crear_asignacion','administrativo_editar_asignacion',
    'administrativo_eliminar_asignacion','administrativo_ver_todos_materias',
    'administrativo_crear_materia','administrativo_editar_materia',
    'administrativo_eliminar_materia',
    'comunicado_crear','comunicado_editar','comunicado_eliminar','comunicado_ver'
);

-- Root (id_rol=8): todos los permisos
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 8, id_permiso FROM `permisos`;

-- ============================================================
-- AUTENTICACIÓN
-- ============================================================

CREATE TABLE `usuarios` (
    `id_usuario` int(11)      NOT NULL AUTO_INCREMENT,
    `nombre`     varchar(100) NOT NULL,
    `apellido`   varchar(100) NOT NULL,
    `email`      varchar(100) NOT NULL,
    `contrasena` varchar(255) NOT NULL,
    `id_rol`     int(11)      NOT NULL,
    PRIMARY KEY (`id_usuario`),
    UNIQUE KEY `email` (`email`),
    KEY `id_rol` (`id_rol`),
    CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- ESTRUCTURA ACADÉMICA
-- ============================================================

CREATE TABLE `profesores` (
    `id_profesor`         int(11)      NOT NULL AUTO_INCREMENT,
    `nombre`              varchar(100) NOT NULL,
    `apellido`            varchar(100) NOT NULL,
    `dni`                 varchar(20)  NOT NULL,
    `email`               varchar(100) NOT NULL,
    `telefono`            varchar(20)  NOT NULL,
    `fecha_nacimiento`    date         NOT NULL,
    `domicilio`           varchar(255) NOT NULL,
    `fecha_contratacion`  date         NOT NULL,
    `estado`              ENUM('activo','baja','licencia') DEFAULT 'activo',
    `titulo_habilitante`  varchar(100) DEFAULT NULL,
    `especialidad`        varchar(100) DEFAULT NULL,
    `id_usuario`          int(11)      DEFAULT NULL,
    PRIMARY KEY (`id_profesor`),
    UNIQUE KEY `uq_profesores_dni`     (`dni`),
    UNIQUE KEY `uq_profesores_email`   (`email`),
    UNIQUE KEY `uq_profesores_usuario` (`id_usuario`),
    KEY `idx_estado`      (`estado`),
    KEY `idx_especialidad`(`especialidad`),
    CONSTRAINT `profesores_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- PERSONAL INSTITUCIONAL
-- ============================================================

-- CORRECCIÓN: agregado ENGINE e InnoDB
CREATE TABLE `cargos` (
    `id_cargo`     int(11)      NOT NULL AUTO_INCREMENT,
    `nombre_cargo` varchar(100) NOT NULL,
    `descripcion`  text         DEFAULT NULL,
    PRIMARY KEY (`id_cargo`),
    UNIQUE KEY `uq_cargo` (`nombre_cargo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `cargos` (`nombre_cargo`, `descripcion`) VALUES
    ('Director',       'Máxima autoridad institucional'),
    ('Vicedirector',   'Asiste al director'),
    ('Secretario',     'Gestión administrativa'),
    ('Preceptor',      'Seguimiento de alumnos'),
    ('Bibliotecario',  'Gestión de biblioteca'),
    ('Administrativo', 'Tareas administrativas'),
    ('Auxiliar',       'Personal auxiliar');

-- CORRECCIÓN: agregado ENGINE e InnoDB
CREATE TABLE `personal` (
    `id_personal`      int(11)      NOT NULL AUTO_INCREMENT,
    `nombre`           varchar(100) NOT NULL,
    `apellido`         varchar(100) NOT NULL,
    `dni`              varchar(20)  NOT NULL,
    `fecha_nacimiento` date         NOT NULL,
    `domicilio`        varchar(255) NOT NULL,
    `telefono`         varchar(20)  NOT NULL,
    `email`            varchar(100) NOT NULL,
    `fecha_ingreso`    date         NOT NULL,
    `estado`           ENUM('activo','licencia','baja') DEFAULT 'activo',
    `id_usuario`       int(11)      DEFAULT NULL,
    `id_cargo`         int(11)      NOT NULL,
    PRIMARY KEY (`id_personal`),
    UNIQUE KEY `uq_personal_dni`     (`dni`),
    UNIQUE KEY `uq_personal_email`   (`email`),
    UNIQUE KEY `uq_personal_usuario` (`id_usuario`),
    KEY `idx_personal_cargo` (`id_cargo`),
    CONSTRAINT `personal_ibfk_cargo` FOREIGN KEY (`id_cargo`)   REFERENCES `cargos`  (`id_cargo`),
    CONSTRAINT `personal_ibfk_1`     FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- CORRECCIÓN: cursos.nivel → ENUM en lugar de VARCHAR libre
CREATE TABLE `cursos` (
    `id_curso`            int(11)   NOT NULL AUTO_INCREMENT,
    `nombre_curso`        varchar(50) NOT NULL,
    `nivel`               ENUM('Ciclo basico','Ciclo superior') NOT NULL,
    `ciclo_lectivo`       smallint unsigned NOT NULL,
    `capacidad_maxima`    int(11)   DEFAULT 30,
    `aula`                varchar(20) DEFAULT NULL,
    `turno`               varchar(100) DEFAULT NULL,
    `id_profesor_titular` int(11)   DEFAULT NULL,
    `id_preceptor`        int(11)   DEFAULT NULL,
    `estado`              ENUM('activo','finalizado','cancelado') DEFAULT 'activo',
    PRIMARY KEY (`id_curso`),
    KEY `idx_ciclo`  (`ciclo_lectivo`),
    KEY `idx_estado` (`estado`),
    KEY `fk_profesor_titular` (`id_profesor_titular`),
    KEY `fk_preceptor` (`id_preceptor`),
    CONSTRAINT `cursos_ibfk_1` FOREIGN KEY (`id_profesor_titular`) REFERENCES `profesores`(`id_profesor`) ON DELETE SET NULL,
    CONSTRAINT `cursos_ibfk_2` FOREIGN KEY (`id_preceptor`) REFERENCES `personal`(`id_personal`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `alumnos` (
    `id_alumno`        int(11)      NOT NULL AUTO_INCREMENT,
    `nombre`           varchar(100) NOT NULL,
    `apellido`         varchar(100) NOT NULL,
    `dni`              varchar(20)  NOT NULL,
    `fecha_nacimiento` date         NOT NULL,
    `nombre_tutor`     varchar(100) NOT NULL,
    `telefono_tutor`   varchar(20)  NOT NULL,
    `domicilio`        varchar(255) NOT NULL,
    `estado`           ENUM('activo','egresado','baja','condicional') DEFAULT 'activo',
    `id_curso`         int(11)      DEFAULT NULL,
    `id_usuario`       int(11)      DEFAULT NULL,
    PRIMARY KEY (`id_alumno`),
    UNIQUE KEY `dni_unico`          (`dni`),
    UNIQUE KEY `uq_alumnos_usuario` (`id_usuario`),
    KEY `id_curso` (`id_curso`),
    CONSTRAINT `alumnos_ibfk_1` FOREIGN KEY (`id_curso`)   REFERENCES `cursos`  (`id_curso`),
    CONSTRAINT `alumnos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `materias` (
    `id_materia`     int(11)           NOT NULL AUTO_INCREMENT,
    `nombre_materia` varchar(100)      NOT NULL,
    `carga_horaria`  tinyint unsigned  NOT NULL,
    `descripcion`    text              DEFAULT NULL,
    PRIMARY KEY (`id_materia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `asignaciones` (
    `id_asignacion` int(11) NOT NULL AUTO_INCREMENT,
    `id_curso`      int(11) NOT NULL,
    `id_materia`    int(11) NOT NULL,
    `id_profesor`   int(11) NOT NULL,
    PRIMARY KEY (`id_asignacion`),
    CONSTRAINT `fk_asig_curso`    FOREIGN KEY (`id_curso`)    REFERENCES `cursos`    (`id_curso`),
    CONSTRAINT `fk_asig_materia`  FOREIGN KEY (`id_materia`)  REFERENCES `materias`  (`id_materia`),
    CONSTRAINT `fk_asig_profesor` FOREIGN KEY (`id_profesor`) REFERENCES `profesores`(`id_profesor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEGUIMIENTO ACADÉMICO
-- ============================================================

CREATE TABLE `notas` (
    `id_nota`       int(11)      NOT NULL AUTO_INCREMENT,
    `id_alumno`     int(11)      NOT NULL,
    `id_asignacion` int(11)      NOT NULL,
    `calificacion`  decimal(3,1) NOT NULL CHECK (`calificacion` >= 0.0 AND `calificacion` <= 10.0),
    `fecha_carga`   date         NOT NULL,
    `observaciones` text         DEFAULT NULL,
    PRIMARY KEY (`id_nota`),
    CONSTRAINT `fk_nota_alumno` FOREIGN KEY (`id_alumno`)     REFERENCES `alumnos`     (`id_alumno`),
    CONSTRAINT `fk_nota_asig`   FOREIGN KEY (`id_asignacion`) REFERENCES `asignaciones`(`id_asignacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ASISTENCIAS
-- CORRECCIÓN: agregado registrado_por FK → usuarios
-- ============================================================

CREATE TABLE `asistencias` (
    `id_asistencia`  int(11) NOT NULL AUTO_INCREMENT,
    `id_alumno`      int(11) NOT NULL,
    `id_curso`       int(11) NOT NULL,
    `fecha`          date    NOT NULL,
    `estado`         ENUM('presente','ausente','justificado','tardanza') NOT NULL,
    `registrado_por` int(11) NOT NULL,
    PRIMARY KEY (`id_asistencia`),
    UNIQUE KEY `uq_asis_dia` (`id_alumno`, `fecha`),
    KEY `id_alumno`      (`id_alumno`),
    KEY `id_curso`       (`id_curso`),
    KEY `registrado_por` (`registrado_por`),
    CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`id_alumno`)      REFERENCES `alumnos` (`id_alumno`),
    CONSTRAINT `asistencias_ibfk_2` FOREIGN KEY (`id_curso`)       REFERENCES `cursos`  (`id_curso`),
    CONSTRAINT `asistencias_ibfk_3` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios`(`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- SANCIONES (requerida por preceptor_gestionar_sanciones)
-- ============================================================

CREATE TABLE `sanciones` (
    `id_sancion`     int(11)  NOT NULL AUTO_INCREMENT,
    `id_alumno`      int(11)  NOT NULL,
    `tipo`           ENUM('apercibimiento','suspension','amonestacion') NOT NULL,
    `motivo`         text     NOT NULL,
    `fecha`          date     NOT NULL,
    `registrado_por` int(11)  NOT NULL,
    PRIMARY KEY (`id_sancion`),
    KEY `id_alumno`      (`id_alumno`),
    KEY `registrado_por` (`registrado_por`),
    CONSTRAINT `sanciones_ibfk_1` FOREIGN KEY (`id_alumno`)      REFERENCES `alumnos` (`id_alumno`),
    CONSTRAINT `sanciones_ibfk_2` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios`(`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TUTORES_ALUMNOS (requerida por tutor_ver_*_hijo)
-- ============================================================

CREATE TABLE `tutores_alumnos` (
    `id_usuario`  int(11)     NOT NULL,
    `id_alumno`   int(11)     NOT NULL,
    `parentesco`  varchar(50) NOT NULL COMMENT 'madre | padre | tutor_legal | otro',
    PRIMARY KEY (`id_usuario`, `id_alumno`),
    CONSTRAINT `fk_tutor_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE,
    CONSTRAINT `fk_tutor_alumno`  FOREIGN KEY (`id_alumno`)  REFERENCES `alumnos` (`id_alumno`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- BIBLIOTECA
-- ============================================================

CREATE TABLE `biblioteca` (
    `id_biblioteca` int(11)      NOT NULL AUTO_INCREMENT,
    `nombre`        varchar(100) NOT NULL,
    `ubicacion`     varchar(100) NOT NULL,
    `responsable`   int(11)      NOT NULL,
    PRIMARY KEY (`id_biblioteca`),
    KEY `responsable` (`responsable`),
    CONSTRAINT `biblioteca_ibfk_1` FOREIGN KEY (`responsable`) REFERENCES `usuarios`(`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `recursos` (
    `id_recurso`    int(11)      NOT NULL AUTO_INCREMENT,
    `nombre`        varchar(100) NOT NULL,
    `tipo`          varchar(50)  NOT NULL,
    `descripcion`   text         DEFAULT NULL,
    `estado`        ENUM('disponible','prestado','dañado','baja') NOT NULL DEFAULT 'disponible',
    `id_biblioteca` int(11)      NOT NULL,
    PRIMARY KEY (`id_recurso`),
    KEY `id_biblioteca` (`id_biblioteca`),
    CONSTRAINT `recursos_ibfk_1` FOREIGN KEY (`id_biblioteca`) REFERENCES `biblioteca`(`id_biblioteca`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `prestamos` (
    `id_prestamo`      int(11) NOT NULL AUTO_INCREMENT,
    `id_recurso`       int(11) NOT NULL,
    `id_usuario`       int(11) NOT NULL,
    `fecha_prestamo`   date    NOT NULL,
    `fecha_devolucion` date    DEFAULT NULL,
    `estado`           ENUM('activo','devuelto','vencido') NOT NULL DEFAULT 'activo',
    PRIMARY KEY (`id_prestamo`),
    KEY `id_recurso` (`id_recurso`),
    KEY `id_usuario` (`id_usuario`),
    CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`id_recurso`) REFERENCES `recursos` (`id_recurso`),
    CONSTRAINT `prestamos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- COMUNIDAD
-- ============================================================

-- CORRECCIÓN: encontrado_por → personal (antes referenciaba 'autoridades' que no existe)
CREATE TABLE `objetos_perdidos` (
    `id_objeto`        int(11)      NOT NULL AUTO_INCREMENT,
    `nombre`           varchar(100) NOT NULL,
    `descripcion`      text         DEFAULT NULL,
    `fecha_encontrado` date         NOT NULL,
    `encontrado_por`   int(11)      DEFAULT NULL,
    `estado`           ENUM('perdido','encontrado','reclamado') NOT NULL DEFAULT 'perdido',
    PRIMARY KEY (`id_objeto`),
    KEY `encontrado_por` (`encontrado_por`),
    CONSTRAINT `fk_objeto_personal` FOREIGN KEY (`encontrado_por`) REFERENCES `personal`(`id_personal`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `comunicados` (
    `id_comunicado`     int(11)   NOT NULL AUTO_INCREMENT,
    `titulo`            varchar(255) NOT NULL,
    `mensaje`           text         NOT NULL,
    `importancia`       ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
    `destino`           ENUM('todos','profesores','alumnos','autoridades','curso') NOT NULL DEFAULT 'todos',
    `curso_destino`     varchar(100) DEFAULT NULL,
    `fecha_publicacion` datetime  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `autor_id`          int(11)   DEFAULT NULL,
    PRIMARY KEY (`id_comunicado`),
    KEY `autor_id` (`autor_id`),
    CONSTRAINT `fk_comunicado_autor` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `noticias` (
    `id_noticia`  int(11)      NOT NULL AUTO_INCREMENT,
    `titulo`      varchar(200) NOT NULL,
    `contenido`   text         NOT NULL,
    `fecha`       date         NOT NULL,
    `autor_id`    int(11)      DEFAULT NULL,
    `imagen`      varchar(255) DEFAULT NULL,
    `imagen_path` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id_noticia`),
    KEY `autor_id` (`autor_id`),
    CONSTRAINT `fk_noticia_autor` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `codigos_verificacion` (
    `id_codigo` INT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `codigo` VARCHAR(6) NOT NULL,
    `tipo` ENUM('registro','recuperacion_password','cambio_email') NOT NULL DEFAULT 'registro',
    `expiracion` DATETIME NOT NULL,
    `usado` BOOLEAN NOT NULL DEFAULT FALSE,
    `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `id_entidad` INT DEFAULT NULL COMMENT 'ID de la entidad asociada (alumno, profesor, etc.). Sin FK porque puede referir a distintas tablas segun rol_asociado.',
    `rol_asociado` VARCHAR(50) DEFAULT 'alumno' COMMENT 'Rol de la entidad asociada (alumno, profesor, etc.)',

    PRIMARY KEY (`id_codigo`),

    INDEX `idx_email` (`email`),
    INDEX `idx_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- ============================================================
-- ÍNDICES DE OPTIMIZACIÓN
-- ============================================================

CREATE INDEX `idx_notas_alumno`      ON `notas`           (`id_alumno`);
CREATE INDEX `idx_asignacion_curso`  ON `asignaciones`    (`id_curso`);
CREATE INDEX `idx_asistencias_fecha` ON `asistencias`     (`fecha`);
CREATE INDEX `idx_prestamos_estado`  ON `prestamos`       (`estado`);
CREATE INDEX `idx_recursos_estado`   ON `recursos`        (`estado`);
CREATE INDEX `idx_objetos_estado`    ON `objetos_perdidos`(`estado`);

COMMIT;
