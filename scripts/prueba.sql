DELETE FROM usuarios;

ALTER TABLE usuarios AUTO_INCREMENT = 1;

INSERT INTO usuarios (
    nombre,
    apellido,
    email,
    contrasena,
    id_rol
)
VALUES (
    'root',
    'a',
    'root@gmail.com',
    '12345678',
    8
);
