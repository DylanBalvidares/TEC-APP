-- ============================================================
--  SEED MASIVO — gestion_tecnica2
--  SOLO usuarios alumno y profesor (SIN delegados)
-- ============================================================

USE gestion_tecnica2;

-- ============================================================
-- LIMPIEZA (orden inverso a las FK)
-- ============================================================
DELETE FROM codigos_verificacion;
DELETE FROM noticias;
DELETE FROM comunicados;
DELETE FROM objetos_perdidos;
DELETE FROM prestamos;
DELETE FROM recursos;
DELETE FROM biblioteca;
DELETE FROM sanciones;
DELETE FROM asistencias;
DELETE FROM notas;
DELETE FROM tutores_alumnos;
DELETE FROM asignaciones;
DELETE FROM materias;
DELETE FROM alumnos;
DELETE FROM cursos;
DELETE FROM personal;
DELETE FROM profesores;
DELETE FROM usuarios;

ALTER TABLE usuarios AUTO_INCREMENT = 1;
ALTER TABLE profesores AUTO_INCREMENT = 1;
ALTER TABLE personal AUTO_INCREMENT = 1;
ALTER TABLE cursos AUTO_INCREMENT = 1;
ALTER TABLE materias AUTO_INCREMENT = 1;
ALTER TABLE alumnos AUTO_INCREMENT = 1;
ALTER TABLE asignaciones AUTO_INCREMENT = 1;
ALTER TABLE notas AUTO_INCREMENT = 1;
ALTER TABLE asistencias AUTO_INCREMENT = 1;
ALTER TABLE sanciones AUTO_INCREMENT = 1;
ALTER TABLE biblioteca AUTO_INCREMENT = 1;
ALTER TABLE recursos AUTO_INCREMENT = 1;
ALTER TABLE prestamos AUTO_INCREMENT = 1;
ALTER TABLE objetos_perdidos AUTO_INCREMENT = 1;
ALTER TABLE comunicados AUTO_INCREMENT = 1;
ALTER TABLE noticias AUTO_INCREMENT = 1;
ALTER TABLE codigos_verificacion AUTO_INCREMENT = 1;

-- ============================================================
-- 1. USUARIOS (SOLO profesores y alumnos — SIN delegados)
--    id_usuario: 1-5=profesores, 6-20=alumnos
--    Contraseña: "12345678"
-- ============================================================
INSERT INTO `usuarios` (`nombre`, `apellido`, `email`, `contrasena`, `id_rol`) VALUES
-- profesores (id=1,2,3,4,5)
('Juan',      'Pérez',        'juan.perez@tecnica2.edu.ar',      '12345678', 3),
('Ana',       'Martínez',     'ana.martinez@tecnica2.edu.ar',    '12345678', 3),
('Roberto',   'García',       'roberto.garcia@tecnica2.edu.ar',  '12345678', 3),
('Laura',     'Fernández',    'laura.fernandez@tecnica2.edu.ar', '12345678', 3),
('Diego',     'Rodríguez',    'diego.rodriguez@tecnica2.edu.ar', '12345678', 3),
-- alumnos (id=6 a 20, total 15)
('Lucas',     'Álvarez',      'lucas.alvarez@tecnica2.edu.ar',      '12345678', 1),
('Camila',    'Benítez',      'camila.benitez@tecnica2.edu.ar',     '12345678', 1),
('Mateo',     'Castro',       'mateo.castro@tecnica2.edu.ar',       '12345678', 1),
('Valentina', 'Delgado',      'valentina.delgado@tecnica2.edu.ar',  '12345678', 1),
('Santiago',  'Escobar',      'santiago.escobar@tecnica2.edu.ar',   '12345678', 1),
('Isabella',  'Flores',       'isabella.flores@tecnica2.edu.ar',    '12345678', 1),
('Benjamín',  'Gómez',        'benjamin.gomez@tecnica2.edu.ar',     '12345678', 1),
('Sofía',     'Herrera',      'sofia.herrera@tecnica2.edu.ar',      '12345678', 1),
('Sebastián', 'Juárez',       'sebastian.juarez@tecnica2.edu.ar',   '12345678', 1),
('Emilia',    'Luna',         'emilia.luna@tecnica2.edu.ar',        '12345678', 1),
('Facundo',   'Medina',       'facundo.medina@tecnica2.edu.ar',     '12345678', 1),
('Mía',       'Navarro',      'mia.navarro@tecnica2.edu.ar',        '12345678', 1),
('Thiago',    'Ortega',       'thiago.ortega@tecnica2.edu.ar',      '12345678', 1),
('Renata',    'Paz',          'renata.paz@tecnica2.edu.ar',         '12345678', 1),
('Joaquín',   'Quiroga',      'joaquin.quiroga@tecnica2.edu.ar',    '12345678', 1);

-- ============================================================
-- 2. PROFESORES (id_usuario: 1,2,3,4,5)
-- ============================================================
INSERT INTO `profesores` (`nombre`, `apellido`, `dni`, `email`, `telefono`, `fecha_nacimiento`, `domicilio`, `fecha_contratacion`, `estado`, `titulo_habilitante`, `especialidad`, `id_usuario`) VALUES
('Juan',      'Pérez',      '20123456', 'juan.perez@tecnica2.edu.ar',      '11-4000-0001', '1980-03-15', 'Av. Siempre Viva 123',   '2015-03-01', 'activo', 'Prof. en Matemática',       'Matemática',       1),
('Ana',       'Martínez',   '21234567', 'ana.martinez@tecnica2.edu.ar',    '11-4000-0002', '1985-07-22', 'Calle Falsa 456',        '2016-04-10', 'activo', 'Lic. en Lengua y Literatura', 'Lengua',         2),
('Roberto',   'García',     '22345678', 'roberto.garcia@tecnica2.edu.ar',  '11-4000-0003', '1978-11-02', 'Belgrano 789',           '2014-02-20', 'activo', 'Prof. en Historia',          'Historia',       3),
('Laura',     'Fernández',  '23456789', 'laura.fernandez@tecnica2.edu.ar', '11-4000-0004', '1990-05-10', 'San Martín 321',         '2018-08-15', 'activo', 'Prof. en Inglés',            'Inglés',         4),
('Diego',     'Rodríguez',  '24567890', 'diego.rodriguez@tecnica2.edu.ar', '11-4000-0005', '1982-09-30', 'Rivadavia 654',          '2017-05-01', 'activo', 'Prof. en Ciencias Naturales', 'Ciencias Nat.', 5);

-- ============================================================
-- 3. PERSONAL (id_usuario=NULL porque no hay usuarios admin/preceptor/biblio)
-- ============================================================
INSERT INTO `personal` (`nombre`, `apellido`, `dni`, `fecha_nacimiento`, `domicilio`, `telefono`, `email`, `fecha_ingreso`, `estado`, `id_usuario`, `id_cargo`) VALUES
('Carlos',   'Giménez',   '30123456', '1975-04-12', 'Av. Corrientes 1000', '11-5000-0001', 'carlos.gimenez@tecnica2.edu.ar',  '2010-01-01', 'activo', NULL, 1), -- Director
('María',    'López',     '31234567', '1980-08-25', 'Av. Cabildo 2000',   '11-5000-0002', 'maria.lopez@tecnica2.edu.ar',     '2012-06-01', 'activo', NULL, 3), -- Secretario
('Patricia', 'Díaz',      '32345678', '1988-12-05', 'Boedo 500',          '11-5000-0003', 'patricia.diaz@tecnica2.edu.ar',   '2016-03-15', 'activo', NULL, 4), -- Preceptor
('Gabriel',  'Álvarez',   '33456789', '1990-07-18', 'Palermo 700',        '11-5000-0004', 'gabriel.alvarez@tecnica2.edu.ar', '2017-09-01', 'activo', NULL, 4), -- Preceptor
('Silvia',   'Moreno',    '34567890', '1985-01-30', 'Flores 300',         '11-5000-0005', 'silvia.moreno@tecnica2.edu.ar',   '2015-11-20', 'activo', NULL, 5); -- Bibliotecario

-- ============================================================
-- 4. MATERIAS
-- ============================================================
INSERT INTO `materias` (`nombre_materia`, `carga_horaria`, `descripcion`) VALUES
('Matemática',          6, 'Álgebra, geometría y análisis matemático'),
('Lengua y Literatura', 5, 'Comprensión lectora, gramática y producción textual'),
('Historia',            4, 'Historia argentina y universal'),
('Geografía',           4, 'Geografía física y humana'),
('Ciencias Naturales',  4, 'Biología, química y física integradas'),
('Inglés',              3, 'Lengua extranjera inglés'),
('Educación Física',    3, 'Actividad física y deportes'),
('Formación Ética',     2, 'Formación ciudadana y ética'),
('Arte',                2, 'Artes visuales y música'),
('Tecnología',          3, 'Informática y tecnología digital'),
('Física',              4, 'Física clásica y moderna'),
('Química',             4, 'Química general y experimental');

-- ============================================================
-- 5. CURSOS (ciclo lectivo 2026)
-- ============================================================
INSERT INTO `cursos` (`nombre_curso`, `nivel`, `ciclo_lectivo`, `capacidad_maxima`, `aula`, `turno`, `id_profesor_titular`, `estado`) VALUES
('1° A', 'Ciclo basico',  2026, 30, 'A-101', 'mañana', 1, 'activo'),
('1° B', 'Ciclo basico',  2026, 30, 'A-102', 'tarde',  2, 'activo'),
('2° A', 'Ciclo basico',  2026, 30, 'B-201', 'mañana', 3, 'activo'),
('2° B', 'Ciclo basico',  2026, 30, 'B-202', 'tarde',  4, 'activo'),
('3° A', 'Ciclo basico',  2026, 30, 'C-301', 'mañana', 5, 'activo'),
('3° B', 'Ciclo basico',  2026, 30, 'C-302', 'tarde',  1, 'activo'),
('4° A', 'Ciclo superior', 2026, 30, 'D-401', 'mañana', 2, 'activo'),
('4° B', 'Ciclo superior', 2026, 30, 'D-402', 'tarde',  3, 'activo'),
('5° A', 'Ciclo superior', 2026, 30, 'E-501', 'mañana', 4, 'activo'),
('5° B', 'Ciclo superior', 2026, 30, 'E-502', 'tarde',  5, 'activo'),
('6° A', 'Ciclo superior', 2026, 30, 'F-601', 'mañana', 1, 'activo'),
('6° B', 'Ciclo superior', 2026, 30, 'F-602', 'tarde',  2, 'activo');

-- ============================================================
-- 6. ALUMNOS (id_usuario: 6→20, total 15 alumnos, SIN delegados)
--    id_curso: 1=1°A, 2=1°B, 3=2°A, 4=2°B, 5=3°A, 7=4°A, 10=5°B, 11=6°A
-- ============================================================
INSERT INTO `alumnos` (`nombre`, `apellido`, `dni`, `fecha_nacimiento`, `nombre_tutor`, `telefono_tutor`, `domicilio`, `estado`, `id_curso`, `id_usuario`) VALUES
-- 1° A — Curso id=1
('Lucas',     'Álvarez',    '40123456', '2010-05-10', 'Ricardo Sosa',    '11-6000-0001', 'Av. Libertador 100',  'activo', 1, 6),
('Camila',    'Benítez',    '41234567', '2010-08-22', 'Ricardo Sosa',    '11-6000-0002', 'Av. Libertador 200',  'activo', 1, 7),
-- 1° B — Curso id=2
('Mateo',     'Castro',     '42345678', '2010-03-14', 'Elena Ruiz',      '11-6000-0003', 'Belgrano 150',        'activo', 2, 8),
('Valentina', 'Delgado',    '43456789', '2010-11-05', 'Elena Ruiz',      '11-6000-0004', 'Belgrano 250',        'activo', 2, 9),
-- 2° A — Curso id=3
('Santiago',  'Escobar',    '44567890', '2009-02-18', 'Ricardo Sosa',    '11-6000-0005', 'San Martín 500',      'activo', 3, 10),
('Isabella',  'Flores',     '45678901', '2009-07-09', 'Ricardo Sosa',    '11-6000-0006', 'San Martín 600',      'activo', 3, 11),
-- 2° B — Curso id=4
('Benjamín',  'Gómez',      '46789012', '2009-01-25', 'Elena Ruiz',      '11-6000-0007', 'Rivadavia 700',       'activo', 4, 12),
('Sofía',     'Herrera',    '47890123', '2009-09-12', 'Elena Ruiz',      '11-6000-0008', 'Rivadavia 800',       'activo', 4, 13),
-- 3° A — Curso id=5
('Sebastián', 'Juárez',     '48901234', '2008-04-30', 'Ricardo Sosa',    '11-6000-0009', 'Corrientes 300',      'activo', 5, 14),
('Emilia',    'Luna',       '49012345', '2008-10-15', 'Ricardo Sosa',    '11-6000-0010', 'Corrientes 400',      'activo', 5, 15),
-- 4° A — Curso id=7
('Facundo',   'Medina',     '50123456', '2007-06-20', 'Elena Ruiz',      '11-6000-0011', 'Callao 200',          'activo', 7, 16),
('Mía',       'Navarro',    '51234567', '2007-12-01', 'Elena Ruiz',      '11-6000-0012', 'Callao 300',          'activo', 7, 17),
-- 5° B — Curso id=10
('Thiago',    'Ortega',     '52345678', '2006-03-08', 'Ricardo Sosa',    '11-6000-0013', 'Pueyrredón 400',      'activo', 10, 18),
('Renata',    'Paz',        '53456789', '2006-08-27', 'Ricardo Sosa',    '11-6000-0014', 'Pueyrredón 500',      'activo', 10, 19),
-- 6° A — Curso id=11
('Joaquín',   'Quiroga',    '54567890', '2005-01-15', 'Elena Ruiz',      '11-6000-0015', 'Córdoba 600',         'activo', 11, 20);

-- NOTA: tutores_alumnos se omite porque no hay usuarios con rol tutor
-- ============================================================
-- 7. (omitido) TUTORES_ALUMNOS — sin usuarios tutores
-- ============================================================

-- ============================================================
-- 8. ASIGNACIONES (curso x materia x profesor)
-- ============================================================
INSERT INTO `asignaciones` (`id_curso`, `id_materia`, `id_profesor`) VALUES
-- 1°A (id=1): Matemática(1), Lengua(2), Historia(3), Ciencias Nat(5), Inglés(6), Educación Física(7)
(1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 5, 5), (1, 6, 4), (1, 7, 1),
-- 1°B (id=2)
(2, 1, 1), (2, 2, 2), (2, 3, 3), (2, 5, 5), (2, 6, 4), (2, 7, 2),
-- 2°A (id=3)
(3, 1, 1), (3, 2, 2), (3, 4, 3), (3, 5, 5), (3, 6, 4), (3, 7, 3),
-- 2°B (id=4)
(4, 1, 1), (4, 2, 2), (4, 4, 3), (4, 5, 5), (4, 6, 4), (4, 7, 4),
-- 3°A (id=5)
(5, 1, 1), (5, 2, 2), (5, 3, 3), (5, 5, 5), (5, 6, 4), (5, 8, 1), (5, 9, 2),
-- 4°A (id=7) - agrega Física(11), Química(12)
(7, 1, 1), (7, 2, 2), (7, 3, 3), (7, 6, 4), (7, 11, 5), (7, 12, 3), (7, 10, 1),
-- 5°B (id=10)
(10, 1, 1), (10, 2, 2), (10, 3, 3), (10, 6, 4), (10, 11, 5), (10, 12, 3), (10, 10, 2),
-- 6°A (id=11)
(11, 1, 1), (11, 2, 2), (11, 3, 3), (11, 6, 4), (11, 11, 5), (11, 12, 3), (11, 10, 4);

-- ============================================================
-- 9. NOTAS (múltiples por alumno por asignación)
--    Las asignaciones tienen id 1-52 según el orden del INSERT.
-- ============================================================
INSERT INTO `notas` (`id_alumno`, `id_asignacion`, `calificacion`, `fecha_carga`, `observaciones`) VALUES
-- Lucas (id=1, curso 1°A → asig 1-6):
(1, 1, 8.5, '2026-03-15', 'Buen desempeño en álgebra'),
(1, 2, 7.0, '2026-03-15', 'Puede mejorar en ortografía'),
(1, 3, 9.0, '2026-03-16', 'Excelente trabajo práctico'),
(1, 4, 8.0, '2026-03-16', 'Buena participación en clase'),
(1, 5, 6.5, '2026-03-17', 'Debe repasar vocabulario'),
(1, 6, 9.5, '2026-03-17', 'Excelente condición física'),
-- Segundo trimestre
(1, 1, 8.0, '2026-06-15', 'Mantuvo el nivel'),
(1, 2, 7.5, '2026-06-15', 'Mejoró en redacción'),
(1, 3, 8.5, '2026-06-16', 'Buena exposición oral'),
(1, 4, 7.0, '2026-06-16', 'Trabajo práctico aprobado'),
(1, 5, 7.0, '2026-06-17', 'Regular, puede dar más'),

-- Camila (id=2):
(2, 1, 9.0, '2026-03-15', 'Muy buena en matemática'),
(2, 2, 8.5, '2026-03-15', 'Buena comprensión lectora'),
(2, 3, 7.0, '2026-03-16', 'Debería participar más'),
(2, 4, 9.0, '2026-03-16', 'Excelente en ciencias'),
(2, 5, 8.5, '2026-03-17', 'Muy buen nivel de inglés'),
(2, 6, 8.0, '2026-03-17', 'Buena condición física'),
(2, 1, 9.5, '2026-06-15', 'Mejoró notablemente'),
(2, 2, 9.0, '2026-06-15', 'Excelente producción escrita'),

-- Mateo (id=3, curso 1°B → asig 7-12):
(3, 7, 6.0, '2026-03-15', 'Necesita apoyo en matemática'),
(3, 8, 7.5, '2026-03-15', 'Regular en lengua'),
(3, 9, 8.0, '2026-03-16', 'Bueno en historia'),
(3, 10, 7.0, '2026-03-16', 'Aprobado en ciencias'),
(3, 11, 6.0, '2026-03-17', 'Debe esforzarse más en inglés'),
(3, 12, 9.0, '2026-03-17', 'Destacado en educación física'),
(3, 7, 6.5, '2026-06-15', 'Leve mejoría'),

-- Valentina (id=4):
(4, 7, 8.5, '2026-03-15', 'Muy buena'),
(4, 8, 9.0, '2026-03-15', 'Excelente en lengua'),
(4, 9, 7.5, '2026-03-16', 'Buena'),
(4, 10, 8.0, '2026-03-16', 'Aprobado'),
(4, 11, 9.0, '2026-03-17', 'Muy buen inglés'),
(4, 12, 8.0, '2026-03-17', 'Buena'),

-- Santiago (id=5, curso 2°A → asig 13-18):
(5, 13, 7.0, '2026-03-15', 'Aprobado'),
(5, 14, 6.5, '2026-03-15', 'Regular'),
(5, 15, 8.0, '2026-03-16', 'Bueno en geografía'),
(5, 16, 7.5, '2026-03-16', 'Aprobado'),
(5, 17, 6.0, '2026-03-17', 'Bajo en inglés'),
(5, 18, 9.0, '2026-03-17', 'Excelente en educación física'),

-- Isabella (id=6):
(6, 13, 9.5, '2026-03-15', 'Excelente en matemática'),
(6, 14, 9.0, '2026-03-15', 'Muy buena en lengua'),
(6, 15, 8.5, '2026-03-16', 'Buena en geografía'),
(6, 16, 9.0, '2026-03-16', 'Muy buena en ciencias'),
(6, 17, 8.0, '2026-03-17', 'Buena en inglés'),
(6, 18, 7.0, '2026-03-17', 'Aprobado'),

-- Benjamín (id=7, curso 2°B → asig 19-24):
(7, 19, 5.0, '2026-03-15', 'Debe esforzarse más'),
(7, 20, 6.0, '2026-03-15', 'Regular'),
(7, 21, 7.0, '2026-03-16', 'Aprobado'),
(7, 22, 6.5, '2026-03-16', 'Puede mejorar'),
(7, 23, 7.5, '2026-03-17', 'Bueno en inglés'),
(7, 24, 8.0, '2026-03-17', 'Buena condición física'),

-- Sofía (id=8):
(8, 19, 8.0, '2026-03-15', 'Buena en matemática'),
(8, 20, 8.5, '2026-03-15', 'Buena en lengua'),
(8, 21, 9.0, '2026-03-16', 'Excelente en geografía'),
(8, 22, 7.5, '2026-03-16', 'Aprobado'),
(8, 23, 8.0, '2026-03-17', 'Buena'),
(8, 24, 9.0, '2026-03-17', 'Excelente'),

-- Sebastián (id=9, curso 3°A → asig 25-31):
(9, 25, 7.0, '2026-03-15', 'Aprobado'),
(9, 26, 6.5, '2026-03-15', 'Regular'),
(9, 27, 8.0, '2026-03-16', 'Bueno en historia'),
(9, 28, 7.5, '2026-03-16', 'Aprobado'),
(9, 29, 6.0, '2026-03-17', 'Bajo en inglés'),
(9, 30, 7.0, '2026-03-17', 'Aprobado en formación ética'),
(9, 31, 8.5, '2026-03-17', 'Bueno en arte'),

-- Emilia (id=10):
(10, 25, 9.0, '2026-03-15', 'Muy buena'),
(10, 26, 9.5, '2026-03-15', 'Excelente en lengua'),
(10, 27, 8.0, '2026-03-16', 'Buena'),
(10, 28, 8.5, '2026-03-16', 'Muy buena'),
(10, 29, 9.0, '2026-03-17', 'Excelente en inglés'),
(10, 30, 7.5, '2026-03-17', 'Aprobado'),
(10, 31, 9.0, '2026-03-17', 'Muy buena en arte'),

-- Facundo (id=11, curso 4°A → asig 32-38):
(11, 32, 6.5, '2026-03-15', 'Regular en matemática'),
(11, 33, 7.0, '2026-03-15', 'Aprobado en lengua'),
(11, 34, 8.0, '2026-03-16', 'Bueno en historia'),
(11, 35, 6.0, '2026-03-16', 'Bajo en inglés'),
(11, 36, 7.5, '2026-03-17', 'Aprobado en física'),
(11, 37, 5.0, '2026-03-17', 'Debe mejorar en química'),
(11, 38, 8.0, '2026-03-17', 'Bueno en tecnología'),

-- Mía (id=12):
(12, 32, 9.5, '2026-03-15', 'Excelente en matemática'),
(12, 33, 9.0, '2026-03-15', 'Muy buena en lengua'),
(12, 34, 8.5, '2026-03-16', 'Buena en historia'),
(12, 35, 9.0, '2026-03-16', 'Excelente en inglés'),
(12, 36, 8.0, '2026-03-17', 'Buena en física'),
(12, 37, 8.5, '2026-03-17', 'Muy buena en química'),
(12, 38, 9.0, '2026-03-17', 'Excelente en tecnología'),

-- Thiago (id=13, curso 5°B → asig 39-45):
(13, 39, 7.0, '2026-03-15', 'Aprobado'),
(13, 40, 6.5, '2026-03-15', 'Regular'),
(13, 41, 8.0, '2026-03-16', 'Bueno'),
(13, 42, 7.5, '2026-03-16', 'Aprobado'),
(13, 43, 6.0, '2026-03-17', 'Bajo en física'),
(13, 44, 7.0, '2026-03-17', 'Aprobado en química'),
(13, 45, 8.5, '2026-03-17', 'Bueno en tecnología'),

-- Renata (id=14):
(14, 39, 8.5, '2026-03-15', 'Buena en matemática'),
(14, 40, 9.0, '2026-03-15', 'Excelente en lengua'),
(14, 41, 8.0, '2026-03-16', 'Buena'),
(14, 42, 9.5, '2026-03-16', 'Excelente en inglés'),
(14, 43, 8.5, '2026-03-17', 'Buena en física'),
(14, 44, 8.0, '2026-03-17', 'Buena'),
(14, 45, 7.0, '2026-03-17', 'Aprobado'),

-- Joaquín (id=15, curso 6°A → asig 46-52):
(15, 46, 9.0, '2026-03-15', 'Excelente en matemática'),
(15, 47, 8.5, '2026-03-15', 'Buena en lengua'),
(15, 48, 7.0, '2026-03-16', 'Aprobado en historia'),
(15, 49, 8.0, '2026-03-16', 'Buena en inglés'),
(15, 50, 9.0, '2026-03-17', 'Excelente en física'),
(15, 51, 8.5, '2026-03-17', 'Buena en química'),
(15, 52, 7.5, '2026-03-17', 'Aprobado en tecnología');

-- ============================================================
-- 10. ASISTENCIAS (solo alumnos id 1-15, SIN delegados)
--     registrado_por: profesores (1=Juan, 2=Ana, 3=Roberto)
-- ============================================================
INSERT INTO `asistencias` (`id_alumno`, `id_curso`, `fecha`, `estado`, `registrado_por`) VALUES
-- Marzo 2026 - 1°A (curso 1, alumnos 1,2)
(1,  1, '2026-03-01', 'presente',   1),
(2,  1, '2026-03-01', 'presente',   1),
(1,  1, '2026-03-02', 'presente',   2),
(2,  1, '2026-03-02', 'presente',   2),
(1,  1, '2026-03-05', 'presente',   2),
(2,  1, '2026-03-05', 'justificado',2),
(1,  1, '2026-03-08', 'presente',   2),
(2,  1, '2026-03-08', 'presente',   2),
(1,  1, '2026-03-12', 'ausente',    2),
(2,  1, '2026-03-12', 'presente',   2),
-- Marzo - 2°A (curso 3, alumnos 5,6)
(5,  3, '2026-03-01', 'presente',   1),
(6,  3, '2026-03-01', 'presente',   1),
(5,  3, '2026-03-02', 'ausente',    3),
(6,  3, '2026-03-02', 'presente',   3),
(5,  3, '2026-03-05', 'presente',   3),
(6,  3, '2026-03-05', 'presente',   3),
(5,  3, '2026-03-08', 'tardanza',   3),
(6,  3, '2026-03-08', 'presente',   3),
-- Marzo - 3°A (curso 5, alumnos 9,10)
(9,  5, '2026-03-01', 'presente',   1),
(10, 5, '2026-03-01', 'presente',   1),
(9,  5, '2026-03-02', 'ausente',    3),
(10, 5, '2026-03-02', 'presente',   3),
(9,  5, '2026-03-05', 'presente',   3),
(10, 5, '2026-03-05', 'justificado',3),
(9,  5, '2026-03-08', 'presente',   3),
(10, 5, '2026-03-08', 'presente',   3),
-- Marzo - 4°A (curso 7, alumnos 11,12)
(11, 7, '2026-03-01', 'presente',   1),
(12, 7, '2026-03-01', 'presente',   1),
(11, 7, '2026-03-02', 'ausente',    2),
(12, 7, '2026-03-02', 'presente',   2),
(11, 7, '2026-03-05', 'presente',   2),
(12, 7, '2026-03-05', 'presente',   2),
(11, 7, '2026-03-08', 'presente',   2),
(12, 7, '2026-03-08', 'presente',   2),
-- Abril
(1,  1, '2026-04-01', 'presente',   2),
(2,  1, '2026-04-01', 'presente',   2),
(5,  3, '2026-04-01', 'presente',   3),
(6,  3, '2026-04-01', 'presente',   3),
(9,  5, '2026-04-01', 'presente',   3),
(10, 5, '2026-04-01', 'presente',   3),
(11, 7, '2026-04-01', 'justificado',2),
(12, 7, '2026-04-01', 'presente',   2),
(1,  1, '2026-04-05', 'presente',   2),
(2,  1, '2026-04-05', 'presente',   2),
(5,  3, '2026-04-05', 'ausente',    3),
(6,  3, '2026-04-05', 'presente',   3),
(9,  5, '2026-04-05', 'presente',   3),
(10, 5, '2026-04-05', 'presente',   3),
(11, 7, '2026-04-05', 'presente',   2),
(12, 7, '2026-04-05', 'presente',   2);

-- ============================================================
-- 11. SANCIONES (registrado_por: profesores 1,2,3)
-- ============================================================
INSERT INTO `sanciones` (`id_alumno`, `tipo`, `motivo`, `fecha`, `registrado_por`) VALUES
(7,  'apercibimiento', 'Llegada tarde reiterada al aula',              '2026-03-20', 2),
(9,  'amonestacion',   'Uso de celular en clase sin autorización',      '2026-04-10', 3),
(11, 'apercibimiento', 'No entregó trabajos prácticos en la fecha',     '2026-05-05', 3),
(13, 'amonestacion',   'Falta de respeto a un compañero',              '2026-05-20', 2);

-- ============================================================
-- 12. BIBLIOTECA (responsable: 11=Silvia Moreno)
-- ============================================================
INSERT INTO `biblioteca` (`nombre`, `ubicacion`, `responsable`) VALUES
('Biblioteca Central "José Hernández"', 'Planta Baja - Ala Este', 1),
('Biblioteca de Ciencias', 'Piso 2 - Ala Oeste', 2);

-- ============================================================
-- 13. RECURSOS
-- ============================================================
INSERT INTO `recursos` (`nombre`, `tipo`, `descripcion`, `estado`, `id_biblioteca`) VALUES
-- Biblioteca Central (id=1)
('El Principito',                        'Libro',    'Antoine de Saint-Exupéry',                          'disponible', 1),
('Cien Años de Soledad',                 'Libro',    'Gabriel García Márquez',                            'prestado',   1),
('Matemática 1° Ciclo',                  'Libro',    'Libro de texto oficial para ciclo básico',          'disponible', 1),
('Atlas Geográfico Universal',           'Libro',    'Atlas con mapas actualizados',                      'disponible', 1),
('Diccionario de la Lengua Española',    'Libro',    'RAE edición 2025',                                 'disponible', 1),
('Enciclopedia de Ciencias Naturales',   'Libro',    'Obra completa en 3 tomos',                          'prestado',   1),
('Historia Argentina Contemporánea',     'Libro',    'Período 1955-2025',                                'disponible', 1),
('Notebook Lenovo X200',                 'Equipo',   'Notebook para uso en sala de lectura',               'dañado',    1),
('Proyector Epson',                      'Equipo',   'Proyector multimedia',                              'disponible', 1),
('Calculadora Científica',               'Equipo',   'Calculadora Casio fx-82LA',                         'disponible', 1),
('Don Quijote de la Mancha',             'Libro',    'Miguel de Cervantes Saavedra',                      'disponible', 1),
('Harry Potter y la Piedra Filosofal',   'Libro',    'J.K. Rowling',                                     'prestado',   1),
-- Biblioteca de Ciencias (id=2)
('Física para Secundaria',               'Libro',    'Manual de física nivel medio',                      'disponible', 2),
('Química Orgánica Básica',              'Libro',    'Introducción a la química orgánica',                'disponible', 2),
('Microscopio Óptico',                   'Equipo',   'Microscopio binocular 40x-1000x',                   'disponible', 2),
('Kit de Laboratorio',                   'Equipo',   'Material básico para experimentos de química',      'prestado',   2),
('Tabla Periódica Interactiva',          'Material', 'Póster laminado con tabla periódica actualizada',   'disponible', 2);

-- ============================================================
-- 14. PRÉSTAMOS (id_usuario: alumnos 6-23, profesor 1)
-- ============================================================
INSERT INTO `prestamos` (`id_recurso`, `id_usuario`, `fecha_prestamo`, `fecha_devolucion`, `estado`) VALUES
(2,  6,  '2026-03-10', '2026-03-24', 'activo'),    -- Cien Años de Soledad → Lucas Álvarez (user 6)
(6,  14, '2026-03-15', '2026-03-29', 'activo'),    -- Enciclopedia → Sebastián Juárez (user 14)
(12, 6,  '2026-04-01', '2026-04-15', 'vencido'),   -- Harry Potter → Lucas Álvarez (user 6)
(16, 17, '2026-04-20', '2026-05-04', 'activo'),    -- Kit de Laboratorio → Mía Navarro (user 17)
(5,  1,  '2026-05-01', '2026-05-08', 'devuelto'),  -- Diccionario → Juan Pérez (user 1)
(3,  8,  '2026-04-25', '2026-05-09', 'activo');    -- Matemática 1°C → Mateo Castro (user 8)

-- ============================================================
-- 15. OBJETOS PERDIDOS (encontrado_por → personal id 3,4,5)
-- ============================================================
INSERT INTO `objetos_perdidos` (`nombre`, `descripcion`, `fecha_encontrado`, `encontrado_por`, `estado`) VALUES
('Mochila azul',           'Mochila marca Nike, color azul, con cuadernos adentro',         '2026-03-05', 3, 'reclamado'),
('Cartuchera',             'Cartuchera roja con lápices y biromes',                          '2026-03-12', 4, 'encontrado'),
('Celular Samsung',        'Celular Samsung Galaxy A14, funda negra',                        '2026-04-02', 3, 'reclamado'),
('Buzo gris',              'Buzo de la escuela, talle M, con nombre "Pérez" bordado',         '2026-04-15', 4, 'encontrado'),
('Llaves',                 'Llavero con 3 llaves y un llavero de Star Wars',                  '2026-05-01', 3, 'perdido'),
('Calculadora científica', 'Calculadora Casio plateada, con su estuche',                      '2026-05-10', 5, 'encontrado'),
('Anteojos',               'Anteojos recetados color negro, marco metálico',                  '2026-05-20', 4, 'perdido'),
('Botella de agua',        'Botella térmica de acero inoxidable, color verde',                '2026-06-01', 3, 'reclamado');

-- ============================================================
-- 15. COMUNICADOS (autor_id: profesores 1-5)
-- ============================================================
INSERT INTO `comunicados` (`titulo`, `mensaje`, `importancia`, `destino`, `fecha_publicacion`, `autor_id`) VALUES
('Inicio de clases 2026', 
 'Bienvenidos a todos al ciclo lectivo 2026. Las clases comienzan el 1 de marzo. Horarios publicados en la cartelera.', 
 'alta', 'todos', '2026-02-25 08:00:00', 1),
('Reunión de padres - 1° trimestre', 
 'Se convoca a los padres a la reunión informativa del primer trimestre el día 15 de abril a las 18:00 hs en el salón de actos.', 
 'media', 'todos', '2026-03-20 10:30:00', 2),
('Suspensión de actividades - Día del Estudiante', 
 'Se informa que el día 21 de septiembre no habrá actividades por celebrarse el Día del Estudiante.', 
 'baja', 'alumnos', '2026-04-01 09:00:00', 1),
('Paro docente - Jueves 10 de abril', 
 'Se informa a la comunidad que el jueves 10 de abril no habrá clases por adhesión al paro docente convocado. Las actividades se retomarán el viernes 11.', 
 'alta', 'todos', '2026-04-05 16:00:00', 1),
('Taller de Robótica 2026', 
 'Inscripciones abiertas para el Taller de Robótica. Actividad extracurricular los días jueves de 17 a 18:30 hs. Cupos limitados. Consultar en Secretaría.', 
 'media', 'alumnos', '2026-04-10 11:00:00', 5),
('Capacitación docente - Nuevas herramientas digitales', 
 'Se invita a todos los docentes a la capacitación obligatoria sobre nuevas herramientas digitales para el aula, el día 5 de mayo a las 14:00 hs en el laboratorio de informática.', 
 'alta', 'profesores', '2026-04-20 14:00:00', 1);

-- ============================================================
-- 16. NOTICIAS (autor_id: profesores 1-5)
-- ============================================================
INSERT INTO `noticias` (`titulo`, `contenido`, `fecha`, `autor_id`) VALUES
('Feria de Ciencias 2026', 
 'La institución invita a todos los alumnos a participar de la Feria de Ciencias 2026. Los proyectos se presentarán en el salón de actos el día 30 de junio. ¡Los esperamos!', 
 '2026-03-01', 1),
('Campeonato Intercolegial de Fútbol', 
 'Nuestra escuela participará en el campeonato intercolegial de fútbol. Los interesados deben anotarse en preceptoría hasta el 15 de marzo.', 
 '2026-03-05', 5),
('Resultados de la Olimpiada de Matemática', 
 'Felicitamos a los alumnos de 5° y 6° año que participaron en la Olimpiada Provincial de Matemática obteniendo el 2° puesto. ¡Orgullo de la escuela!', 
 '2026-04-12', 3),
('Jornada de Reciclaje', 
 'El viernes 25 de abril se realizará una jornada de reciclaje en la escuela. Trae tus materiales reciclables y participá de las actividades.', 
 '2026-04-18', 2),
('Acto del 25 de Mayo', 
 'El día viernes 23 de mayo se realizará el acto en conmemoración de la Revolución de Mayo. Participación de todos los cursos. Horario habitual.', 
 '2026-05-15', 1),
('Semana de la Literatura', 
 'Del 10 al 14 de junio se llevará a cabo la Semana de la Literatura con actividades, talleres de escritura y lectura. Cronograma disponible en biblioteca.', 
 '2026-06-01', 4);

-- ============================================================
-- 17. CÓDIGOS DE VERIFICACIÓN
-- ============================================================
INSERT INTO `codigos_verificacion` (`email`, `codigo`, `tipo`, `expiracion`, `usado`, `id_entidad`, `rol_asociado`) VALUES
('lucas.alvarez@tecnica2.edu.ar',  'ABC123', 'registro', '2026-01-15 12:00:00', TRUE,  1,  'alumno'),
('camila.benitez@tecnica2.edu.ar', 'DEF456', 'registro', '2026-01-15 12:10:00', TRUE,  2,  'alumno'),
('juan.perez@tecnica2.edu.ar',     'GHI789', 'registro', '2026-01-10 10:00:00', TRUE,  1,  'profesor'),
('nuevo.alumno@tecnica2.edu.ar',   'JKL012', 'registro', '2026-07-15 13:00:00', FALSE, NULL, 'alumno');

-- ============================================================--  NOTA: objetos_perdidos (FK→personal) y recursos NO referencian usuarios.
-- ============================================================

-- ============================================================
-- ¡FIN DEL SCRIPT!
-- Total aproximado:
--   usuarios:      20 (solo profesores y alumnos)
--   profesores:     5
--   personal:       5
--   cursos:        12
--   alumnos:       15
--   materias:      12
--   asignaciones:  52
--   notas:        ~120
--   asistencias:   ~48
--   sanciones:      5
--   bibliotecas:    2
--   recursos:      17
--   préstamos:      6
--   objetos perd.:  8
--   comunicados:    6
--   noticias:       6
--   códigos verif:  4
-- ============================================================
