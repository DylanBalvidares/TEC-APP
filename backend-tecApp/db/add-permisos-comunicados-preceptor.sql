-- ============================================================
--  Migración: permisos de comunicados para el rol preceptor
--  Otorga comunicado_crear/editar/eliminar/ver al id_rol=4.
--  Idempotente (INSERT IGNORE). Aplicar en DBs existentes:
--    mysql -u root -p gestion_tecnica2 < add-permisos-comunicados-preceptor.sql
-- ============================================================

USE gestion_tecnica2;

INSERT IGNORE INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT 4, id_permiso FROM `permisos` WHERE `nombre_permiso` IN (
    'comunicado_crear','comunicado_editar','comunicado_eliminar','comunicado_ver'
);
