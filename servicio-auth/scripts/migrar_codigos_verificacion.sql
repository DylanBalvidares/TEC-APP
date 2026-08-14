-- ============================================================
-- Migración: Reparar tabla codigos_verificacion
-- Tabla: codigos_verificacion
-- 1. Eliminar FK constraint y renombrar id_alumno → id_entidad (si existe)
-- 2. Agregar columna rol_asociado (si falta)
-- ============================================================

USE gestion_tecnica2;

-- ============================================================
-- Paso 1: Renombrar id_alumno → id_entidad (migración anterior)
-- ============================================================

-- Verificar si existe la FK constraint fk_codigo_alumno y eliminarla
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                  WHERE CONSTRAINT_SCHEMA = 'gestion_tecnica2'
                    AND TABLE_NAME = 'codigos_verificacion'
                    AND CONSTRAINT_NAME = 'fk_codigo_alumno'
                    AND CONSTRAINT_TYPE = 'FOREIGN KEY');

SET @drop_fk_sql = IF(@fk_exists > 0,
    'ALTER TABLE `codigos_verificacion` DROP FOREIGN KEY `fk_codigo_alumno`',
    'SELECT 1 AS noop');
PREPARE stmt FROM @drop_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si existe el índice fk_codigo_alumno y eliminarlo
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
                   WHERE TABLE_SCHEMA = 'gestion_tecnica2'
                     AND TABLE_NAME = 'codigos_verificacion'
                     AND INDEX_NAME = 'fk_codigo_alumno');

SET @drop_idx_sql = IF(@idx_exists > 0,
    'ALTER TABLE `codigos_verificacion` DROP INDEX `fk_codigo_alumno`',
    'SELECT 1 AS noop');
PREPARE stmt2 FROM @drop_idx_sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Verificar si existe la columna id_alumno y renombrarla a id_entidad
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = 'gestion_tecnica2'
                     AND TABLE_NAME = 'codigos_verificacion'
                     AND COLUMN_NAME = 'id_alumno');

SET @rename_sql = IF(@col_exists > 0,
    'ALTER TABLE `codigos_verificacion` CHANGE COLUMN `id_alumno` `id_entidad` INT DEFAULT NULL COMMENT \'ID de la entidad asociada (alumno, profesor, etc.). Sin FK porque puede referir a distintas tablas segun rol_asociado.\'',
    'SELECT 1 AS noop');
PREPARE stmt3 FROM @rename_sql;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- ============================================================
-- Paso 2: Agregar columna rol_asociado (si no existe ya)
-- ============================================================

-- La columna rol_asociado es necesaria para que el modelo Sequelize
-- pueda guardar y recuperar qué rol tiene la entidad asociada al código.
-- Sin esta columna, guardarCodigoVerificacion() falla con
-- "Error interno al crear codigo de verificacion".
SET @rol_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = 'gestion_tecnica2'
                     AND TABLE_NAME = 'codigos_verificacion'
                     AND COLUMN_NAME = 'rol_asociado');

SET @add_rol_sql = IF(@rol_exists = 0,
    'ALTER TABLE `codigos_verificacion` ADD COLUMN `rol_asociado` VARCHAR(50) DEFAULT \'alumno\' COMMENT \'Rol de la entidad asociada (alumno, profesor, etc.).\'',
    'SELECT 1 AS noop');
PREPARE stmt4 FROM @add_rol_sql;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;
