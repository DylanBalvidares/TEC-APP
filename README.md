# TEC-APP — Técnica N°2

Aplicación web para la gestión de la Escuela Técnica N°2, con herramientas para administrar alumnos, profesores, cursos, materias, biblioteca y comunidad.

## Cómo ejecutar

Requisitos: [Git](https://git-scm.com/) y [Docker con Docker Compose](https://docs.docker.com/get-docker/).

```bash
# Clonar el repositorio y entrar al proyecto
git clone <url-del-repositorio>
cd TEC-APP

# Crear la configuración local
cp .env.example .env
```

Editá `.env` y reemplazá los valores de ejemplo, en especial `MYSQL_ROOT_PASSWORD` y `JWT_SECRET`.

```bash
# Construir y levantar los servicios
docker compose up -d --build
```

La aplicación estará disponible en:

- Frontend: <http://localhost:5173>
- API: <http://localhost:9000>
- phpMyAdmin: <http://localhost:8000>

Para detener los servicios:

```bash
docker compose down
```

## Datos de prueba (dataset demo)

Después de levantar el stack, cargá el dataset completo de prueba con un solo comando (desde la raíz o desde `backend-tecApp/`):

```bash
npm run seed
```

- Crea ~12 cursos, ~80 alumnos, profesores, preceptores, notas, boletines (1er cuatrimestre cerrado y 2do abierto), asistencias, sanciones, comunicados, biblioteca con préstamos, correos, WhatsApp, auditoría y configuración.
- Es **idempotente**: re-ejecutarlo reemplaza los datos demo sin duplicarlos y sin tocar datos reales (todo marcado con IDs >= 9000).
- Para borrar solo los datos demo: `npm run seed -- --limpiar`.
- Variante dentro del contenedor (si no tenés Node en el host): `npm run seed:docker`. Requiere que la imagen sea posterior a este commit (si tu contenedor `backend` es de antes, rehacelo con `docker compose build backend`).

Cuentas demo (todas con clave `admin123`):

| Rol           | Email                              |
| ------------- | ---------------------------------- |
| root          | `root@tecnica2.edu.ar`             |
| administrativo| `admin@tecnica2.edu.ar`           |
| preceptor     | `preceptor@tecnica2.edu.ar`        |
| preceptor     | `preceptor2@tecnica2.edu.ar`       |
| preceptor     | `preceptor3@tecnica2.edu.ar`       |
| profesor      | `profesor@tecnica2.edu.ar`         |
| profesor      | `mariana.ferreyra@tecnica2.edu.ar` |
| bibliotecario | `bibliotecario@tecnica2.edu.ar`    |
| delegado      | `nicolas.vega@tecnica2.edu.ar`     |
| delegado      | `brenda.paz@tecnica2.edu.ar`       |
| alumno        | `alumno@tecnica2.edu.ar`           |
| alumno        | `tadeo.martinez@tecnica2.edu.ar`   |
| tutor         | `maria.lopez@tecnica2.edu.ar`      |

También hay 10 profesores más (`silvina.gonzalez@`, `gustavo.pereyra@`, etc.), 2 tutors más (`carlos.sosa@`, `gabriela.nunez@`) y los alumnos (legajo) usan Gmail para el envío de correos.
