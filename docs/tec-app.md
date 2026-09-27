# TEC-APP — Documento general del proyecto

Escuela Técnica N°2 — gestión integral (alumnos, profesores, cursos, materias,
biblioteca, comunidad, usuarios y Libreta Digital).

> Última actualización: 2026-09-27 · Rama activa: `dev`.

## 1. Stack y estructura

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 + Vite 5 (`frontend-tecApp/`, dev en `:5173`, base `/frontend-tecApp/`) |
| Backend | Express 4 + Sequelize 6 (`backend-tecApp/`, API en `:9000`, prefijo `/api`) |
| DB | MySQL 8 (`gestion_tecnica2`), volumen persistente `db_data` |
| Infra | Docker Compose (backend, frontend, mysql, phpmyadmin en `127.0.0.1:8000`) |
| Tests | `node --test` (backend, 13 tests), vitest (frontend, 33 tests), CI en push/PR a `dev` y `main` |

```
tec-app/
├── frontend-tecApp/src/   # app.vue, router, stores, services, components/{administrador,alumno,preceptor,profesores,bibliotecario,auth,ui}, composables, utils
├── backend-tecApp/src/    # server.js, db/{conexionDB,models,ensure*}, middlewares, modules/{academico,auth,biblioteca,comunidad,usuarios}, utils
├── backend-tecApp/db/     # gestion_tecnica2.sql, prueba.sql, seed.sql, .env (local, gitignored)
├── old-backend/           # LEGADO (gateway + servicios viejos). No tocar, pendiente de eliminar.
├── cambios-pendientes/    # Copia plana de trabajo (248M). Ignorada por git. No tocar.
└── docs/                  # Esta documentación.
```

Ramas: `dev` (desarrollo activo) y `main`. Las ramas `temp/*` son temporales y se
eliminan tras mergear.

## 2. Backend — convenciones

- **Módulos** con patrón `*-controller.js` (lógica + Sequelize) + `*-router.js`
  (rutas + `comprobarPermiso`). Montaje en `src/server.js` (`/api/usuarios`,
  `/api/academico`, `/api/comunidad`, `/api/biblioteca`, `/api/auth` público).
- **Auth**: `autenticar` verifica el JWT y deja `id_usuario` / `id_rol` en headers.
  `comprobarPermiso()` es **fail-closed**: exige permiso explícito (`string`,
  `array` o símbolo `SOLO_AUTENTICADO` de `utils/permisosConfig.js`); sin él
  responde 500 de configuración, nunca abre.
- **Errores**: `ErrorHandler(status, message)` + handler global → contrato
  `{ ok:false, error, message }`. Los 404 de rutas caen en el handler uniforme.
- **Roles**: `root` (8) tiene todos los permisos del seed; el resto (alumno 1,
  profesor 3, preceptor 4, bibliotecario 5, administrativo 7...) solo los suyos.
  Evitar IDs mágicos nuevos (ver `utils/rolPadron.js` para el registro).
- **Seguridad aplicada**: helmet, rate-limit (`/api/auth` 60/15min, login y
  verificar-código 10/15min), CORS por allowlist `CORS_ORIGINS`, body JSON ≤
  `JSON_BODY_LIMIT`, `JWT_SECRET` obligatorio fuera de development/test,
  `GET /api/health` público. Emails vía Gmail SMTP (ver `utils/sendMail.js`).

### 2.1 Libreta Digital (endpoints)

Base: `/api/academico/notas`. La calificación válida es 0–10; crear hace
upsert y todo cambio se audita en `historial_notas` (`modificado_por`, motivo).

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `GET /notas/profesor` | profesor | Sus asignaciones + alumnos + notas |
| `GET /notas/preceptor/curso/:id` | preceptor (solo sus cursos), root/admin | Planilla del curso |
| `GET /notas/mis-notas` | alumno (por JWT) | Sus notas + promedios |
| `GET /notas/historial/alumno/:id` | profesor / preceptor / alumno propio / root | Timeline de cambios |
| `POST /notas` | profesor, root/admin | Crea o actualiza (upsert) |
| `PATCH /notas` | profesor, root/admin | Modifica por `id_nota` |
| `DELETE /notas/:id` | profesor, root/admin | Elimina |

Reglas: el profesor solo califica sus asignaciones y alumnos del curso;
el preceptor es solo-lectura (403 al escribir); el alumno solo ve lo suyo
(403 a lo ajeno); root/admin salta autoría pero queda auditado.

## 3. Frontend — convenciones

- **Vistas por rol** con layout propio (Sidebar + Topbar): `alumno/`, `profesores/`,
  `preceptor/`, `bibliotecario/`, `auth/`.
- **Panel admin** (`administrador/`): una sola ruta (`/dashboard-administrador`,
  solo root) con **vistas internas por clave** (`DashboardAdministrador.vue` →
  `componentesMap` + `pageNames` + `?vista=` sincronizada), no rutas de router.
- **UI compartida**: clases globales de `assets/admin-shared.css`
  (`card`, `table.mini`, `tb-btn`, `icon-btn`, `badge-*`, `search-box`,
  `empty-state`), iconos `ti`, `components/ui/{Modal.vue` (Teleport),
  `Pagination.vue, Toasts.vue}`.
- **Servicios** (`src/services/*-service.js`): axios con `getConfig()` (token de
  Pinia) y `manejarErrorApi()`; interceptor 401 → logout + redirect a login.
- **Libreta UI**: profesor `/profesor/libreta` (carga), preceptor
  `/preceptor/libreta` (planilla), alumno `/alumno/libreta` (promedios),
  admin vista interna `libreta` (supervisión + corrección).

## 4. Infra local y entorno

```bash
docker compose up -d --build   # levanta todo (mysql persiste en db_data)
docker logs backend-tec-app    # ver arranque (ensures + conexión)
```

- **MySQL solo en `127.0.0.1:3306`**; phpMyAdmin en `127.0.0.1:8000`.
- **Variables**: `.env` en raíz (solo para interpolación del compose:
  `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `NODE_ENV`) + `backend-tecApp/db/.env`
  (inyectado a contenedores vía `env_file`: `DATABASE_URL`, `JWT_SECRET`,
  `CORS_ORIGINS`, email...). Ambos gitignored.
- ⚠️ `env_file` **no** alimenta la interpolación `${...}` del compose (solo el
  `.env` raíz y el entorno del shell). `MYSQL_ROOT_PASSWORD` debe coincidir con
  volumen `db_data` (ver `MYSQL_ROOT_PASSWORD` en tu `.env`); si difiere,
  si difiere, MySQL rechaza el login y el backend no arranca.
- El SQL init **no se re-ejecuta** con volumen existente → cambios de esquema en
  DBs vivas van por `src/db/ensure*.js` (patrón `ensureCorreosTable`,
  `ensureLibretaDigital`) + actualización de `gestion_tecnica2.sql` para installs
  frescos. Uploads persisten en volumen `uploads_data`.
- `NODE_ENV=production` por defecto en compose: exige `JWT_SECRET` y
  `DATABASE_URL`; CORS solo permite `CORS_ORIGINS` (incluir
  `http://localhost:5173` para el dev del frontend).

## 5. Credenciales de prueba (solo entorno local)

Password único: **`admin123`**.

| Rol | Email | Notas |
|---|---|---|
| root | `root@tecnica2.edu.ar` | Todos los permisos; entra al panel admin |
| profesor | `profesor@tecnica2.edu.ar` | `id_profesor=1` (Matemática, 1º Año) |
| preceptor | `preceptor@tecnica2.edu.ar` | `id_personal=1`, a cargo de cursos 1–7 |
| alumno | `alumno@tecnica2.edu.ar` | `id_alumno=1` (1º Año) |

⚠️ Precauciones: rate-limit de login (10 intentos/15min) al probar; el JWT se
rota periódicamente (está en `db/.env`, gitignored); `token*.txt` no deben
quedarse en el disco; nunca usar estas credenciales fuera del entorno local.

## 6. Workflows verificados

```bash
cd backend-tecApp && npm test        # 13/13 (node --test)
cd frontend-tecApp && npm test       # 33/33 (vitest run)
cd frontend-tecApp && npm run build  # vite build (~560KB, chunk único: hay deuda de code-splitting)
```

- **Smoke API**: login por rol → probar matriz (200 en lo permitido, 403 en lo
  ajeno, 404 en rutas inexistentes como el viejo `PATCH /api/auth/auth/`).
- **Smoke browser** (Playwright MCP, Firefox): login → vistas de libreta por rol
  → guardar nota → historial; admin → planilla → editar/eliminar → historial.
- Commits chicos y atómicos con prefijos `feat/fix/chore/test/docs`; ramas
  `temp/*` se borran tras el merge; `dist/` versionado: revertir cambios de
  build (`git checkout -- frontend-tecApp/dist`) para no ensuciar diffs.
- Deudas conocidas: code-splitting frontend, paginación server-side, caché de
  permisos (1 query JOIN por request), cola de emails, `old-backend/` y
  `cambios-pendientes/` por eliminar, warning Vue pre-existente en
  `CursosPreceptorView` (`cursoSeleccionado`), encoding latin1 heredado en
  algunos textos de la DB.
