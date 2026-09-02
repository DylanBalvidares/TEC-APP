-- ============================================================
--  CUENTAS DEFAULT — gestion_tecnica2
--  Inyecta un usuario por rol: alumno, profesor, preceptor, root
--
--  Credenciales (mismas para todas):
--    Email:   ver abajo
--    Clave:   admin123
--
--  IMPORTANTE: la tabla `usuarios` guarda la contraseña en
--  texto plano (el servicio de login la compara directamente).
-- ============================================================

USE gestion_tecnica2;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- ROOT  (id_rol = 8)  — solo tabla usuarios
-- ============================================================
DELETE FROM `usuarios` WHERE `email` = 'root@tecnica2.edu.ar';
INSERT INTO `usuarios` (`nombre`, `apellido`, `email`, `contrasena`, `id_rol`) VALUES
('Root', 'Sistema', 'root@tecnica2.edu.ar', 'admin123', 8);

-- ============================================================
-- PROFESOR  (id_rol = 3)  — usuarios + profesores
-- ============================================================
DELETE FROM `profesores` WHERE `email` = 'profesor@tecnica2.edu.ar';
DELETE FROM `usuarios`   WHERE `email` = 'profesor@tecnica2.edu.ar';
INSERT INTO `usuarios` (`nombre`, `apellido`, `email`, `contrasena`, `id_rol`) VALUES
('Profesor', 'Demo', 'profesor@tecnica2.edu.ar', 'admin123', 3);
INSERT INTO `profesores`
    (`nombre`, `apellido`, `dni`, `email`, `telefono`, `fecha_nacimiento`,
     `domicilio`, `fecha_contratacion`, `estado`, `titulo_habilitante`,
     `especialidad`, `id_usuario`)
SELECT 'Profesor', 'Demo', '39999999', 'profesor@tecnica2.edu.ar', '11-9999-9999',
       '1985-01-01', 'Av. Demo 123', '2020-03-01', 'activo',
       'Prof. en Informática', 'Informática',
       `id_usuario`
FROM `usuarios`
WHERE `email` = 'profesor@tecnica2.edu.ar';

-- ============================================================
-- PRECEPTOR  (id_rol = 4)  — usuarios + personal (cargo Preceptor)
-- ============================================================
DELETE FROM `personal` WHERE `email` = 'preceptor@tecnica2.edu.ar';
DELETE FROM `usuarios`  WHERE `email` = 'preceptor@tecnica2.edu.ar';
INSERT INTO `usuarios` (`nombre`, `apellido`, `email`, `contrasena`, `id_rol`) VALUES
('Preceptor', 'Demo', 'preceptor@tecnica2.edu.ar', 'admin123', 4);
INSERT INTO `personal`
    (`nombre`, `apellido`, `dni`, `fecha_nacimiento`, `domicilio`, `telefono`,
     `email`, `fecha_ingreso`, `estado`, `id_usuario`, `id_cargo`)
SELECT 'Preceptor', 'Demo', '39999998', '1985-01-01', 'Av. Demo 123', '11-9999-9998',
       'preceptor@tecnica2.edu.ar', '2020-03-01', 'activo',
       u.`id_usuario`,
       (SELECT `id_cargo` FROM `cargos` WHERE `nombre_cargo` = 'Preceptor' LIMIT 1)
FROM `usuarios` u
WHERE u.`email` = 'preceptor@tecnica2.edu.ar';

-- ============================================================
-- ALUMNO  (id_rol = 1)  — usuarios + alumnos
-- ============================================================
DELETE FROM `alumnos` WHERE `dni` = '39999997';
DELETE FROM `usuarios` WHERE `email` = 'alumno@tecnica2.edu.ar';
INSERT INTO `usuarios` (`nombre`, `apellido`, `email`, `contrasena`, `id_rol`) VALUES
('Alumno', 'Demo', 'alumno@tecnica2.edu.ar', 'admin123', 1);
INSERT INTO `alumnos`
    (`nombre`, `apellido`, `dni`, `fecha_nacimiento`, `nombre_tutor`,
     `telefono_tutor`, `domicilio`, `estado`, `id_curso`, `id_usuario`)
SELECT 'Alumno', 'Demo', '39999997', '2010-01-01', 'Tutor Demo',
       '11-9999-9997', 'Av. Demo 123', 'activo',
       (SELECT `id_curso` FROM `cursos` LIMIT 1),
       u.`id_usuario`
FROM `usuarios` u
WHERE u.`email` = 'alumno@tecnica2.edu.ar';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- RESUMEN
-- ============================================================
SELECT u.`id_usuario`, u.`email`, u.`contrasena`, r.`nombre_rol`
FROM `usuarios` u
JOIN `roles` r ON r.`id_rol` = u.`id_rol`
WHERE u.`email` IN
    ('root@tecnica2.edu.ar','profesor@tecnica2.edu.ar',
     'preceptor@tecnica2.edu.ar','alumno@tecnica2.edu.ar')
ORDER BY u.`id_usuario`;
