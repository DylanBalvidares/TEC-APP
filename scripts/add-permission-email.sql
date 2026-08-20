-- ============================================================
--  PERMISO: preceptor_enviar_email_alumno
--  Vincula el nuevo permiso al rol preceptor (id_rol=4)
-- ============================================================

USE gestion_tecnica2;

-- 1. Insertar el permiso (ignorar si ya existe)
INSERT IGNORE INTO `permisos` (`nombre_permiso`) VALUES
    ('preceptor_enviar_email_alumno');

-- 2. Vincular al rol preceptor (id_rol=4)
INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 4, id_permiso FROM `permisos` WHERE `nombre_permiso` = 'preceptor_enviar_email_alumno';
