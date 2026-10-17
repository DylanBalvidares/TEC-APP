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
