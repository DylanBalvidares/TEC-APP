<div align="center">

# TEC-APP — Técnica N°2

**tec-app** es una aplicacion web para la gestion integral de la escuela Tecnica N°2. Permite administrar alumnos, profesores, cursos, materias, biblioteca, comunidad y usuarios con sus respectivos roles y permisos.

![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?logo=vuedotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

</div>


## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) 18+ (solo si se ejecuta sin Docker)

---

## Ejecucion rapida con Docker

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd tec-app

# Levantar todos los servicios
docker-compose up -d
```

Una vez levantados, la aplicacion estara disponible en:

- **Frontend:** `http://localhost:5173`
- **API Backend(gateway):** `http://localhost:9000`

Para detener los servicios:

```bash
docker-compose down
```

---


> **Nota:** Tener en cuenta configurar las variables de entorno `.env` en cada servicio antes de ejecutar. Se pueden copiar los archivos `.env.example` como referencia.

### Frontend

```bash
cd frontend-tecApp

# Instalar dependencias
npm install

# Servidor de desarrollo (puerto 5173)
npm run dev
```

---

## Estructura del proyecto

```
tec-app/
├── backend-tecApp/
│   ├── api-gateway/          # Gateway (puerto 9000)
│   ├── servicio-academico/   # Gestion academica (puerto 3307)
│   ├── servicio-auth/        # Autenticacion (puerto 3308)
│   ├── servicio-usuarios/    # Usuarios y roles (puerto 3310)
│   ├── servicio-biblioteca/  # Biblioteca (puerto 3309)
│   ├── servicio-comunidad/   # Comunidad (puerto 3305)
│   └── db/                   # Scripts SQL y configuracion
├── frontend-tecApp/          # Aplicacion Vue 3 + Vite
├── docker-compose.yml        # Orquestacion de servicios
└── package.json              # Dependencias del backend
```
