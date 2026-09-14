-- ============================================================
-- SEED — CURSOS
-- Requiere datos base ya cargados: profesores (id_profesor=1)
-- y personal (id_personal=1). Reescribe/inserta cursos de prueba.
-- Uso: npm run seed
-- ============================================================

INSERT IGNORE INTO `cursos`
  (`id_curso`, `nombre_curso`, `nivel`, `ciclo_lectivo`, `capacidad_maxima`, `aula`, `turno`, `id_profesor_titular`, `id_preceptor`, `estado`)
VALUES
  (1, '1º Año',               'Ciclo basico',   2026, 30, '101', 'Mañana',    1, 1, 'activo'),
  (2, '1º B',                 'Ciclo basico',   2026, 30, '102', 'Mañana',    1, 1, 'activo'),
  (3, '2º A',                 'Ciclo basico',   2026, 30, '103', 'Tarde',     1, 1, 'activo'),
  (4, '3º A',                 'Ciclo basico',   2026, 30, '104', 'Tarde',     1, 1, 'activo'),
  (5, '4º A - Electrónica',   'Ciclo superior', 2026, 30, '201', 'Mañana',    1, 1, 'activo'),
  (6, '5º A - Informática',   'Ciclo superior', 2026, 30, '202', 'Mañana',    1, 1, 'activo'),
  (7, '6º B - Electromecánica', 'Ciclo superior', 2026, 30, '203', 'Tarde',    1, 1, 'activo');