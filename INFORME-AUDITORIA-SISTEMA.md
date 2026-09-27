# Informe de Auditoría — TEC-APP (Técnica N°2)

**Fecha:** 26/09/2026 · **Rama auditada:** `dev` · **Alcance:** backend Express + MySQL, frontend Vue 3, configuración Docker, esquema de datos, tests y organización del repositorio.
**Tipo de trabajo:** análisis estático de solo lectura. **No se modificó ningún archivo existente**; se agregaron únicamente este informe (`.md`) y su versión en texto (`.txt`).

---

## 1. Resumen ejecutivo

El sistema está **funcionalmente completo y bien estructurado** (separación por módulos, permisos por ruta en el núcleo académico, verificaciones de pertenencia en notas, manejo de errores centralizado). Sin embargo, la auditoría encontró **2 vulnerabilidades críticas**, **4 problemas altos** (casi todos de control de acceso) y un conjunto de deudas técnicas y incoherencias que conviene resolver antes de considerar el sistema listo para producción.

| Severidad | Cantidad | Áreas |
|---|---|---|
| 🔴 Crítico | 2 | Autenticación/registro (escalada de privilegios y toma de cuentas) |
| 🟠 Alto | 4 | Control de acceso en comunidad y biblioteca, exposición de datos |
| 🟡 Medio | 10 | Hardening, configuración Docker, logs, migraciones, contratos de API |
| 🔵 Bajo / Calidad | 8 | Duplicación, tests, CI, código legado, accesibilidad |

**Métricas del código auditado:** ~39.900 líneas en `frontend-tecApp/src`, ~8.350 líneas en `backend-tecApp/src`, 18 routers backend, 22 archivos de build (`dist/`) versionados, 102 archivos de un backend legado (`old-backend/`) todavía en el repositorio.

---

## 2. 🔴 Vulnerabilidades críticas

### CRIT-1 — Endpoint público permite tomar cuentas y escalar a administrador
- **Dónde:** `backend-tecApp/src/modules/auth/auth-router.js` (ruta `authRouter.patch("/auth/", ...)`) montada públicamente en `backend-tecApp/src/server.js` (`app.use("/api/auth", authRouter)`, fuera del bloque de rutas protegidas).
- **Qué pasa:** `PATCH /api/auth/auth/` ejecuta `modificarUsuario(req.body)` **sin `autenticar` ni `comprobarPermiso`**. El controlador actualiza `nombre, apellido, email, contrasena` e **`id_rol`**.
- **Impacto:** cualquiera con acceso HTTP al backend (el `docker-compose` publica el puerto **9000**) puede cambiar el email y la contraseña de cualquier usuario enumerando `id_usuario`, o enviar `id_rol: 8` para convertirse en **root**. Es toma de cuentas + escalada de privilegios sin credenciales.
- **Remediación sugerida:** eliminar la ruta o moverla detrás de `autenticar` + `comprobarPermiso("administrativo_editar_usuario")`, restringiendo `id_rol` y `contrasena` a un servicio de perfil propio.

### CRIT-2 — El registro acepta el rol enviado por el cliente
- **Dónde:** `backend-tecApp/src/modules/auth/auth-router.js`, ruta `POST /verificar-codigo`. Fragmento: `let assigned_id_rol = id_rol;` y sólo si viene vacío se resuelve por padrón (`alumno→1`, `profesor→3`, `administrativo→7`).
- **Qué pasa:** con un código de verificación válido (obtenido para un alumno/profesor legítimo), el cliente puede enviar `id_rol: 8` y **crear su cuenta como root**.
- **Impacto:** escalada de privilegios inmediata en el auto-registro.
- **Remediación sugerida:** ignorar `id_rol` del cliente y derivarlo **siempre** de `verificado.rol_asociado`; agregar un test de regresión.

---

## 3. 🟠 Problemas altos (control de acceso)

### HIGH-1 — La biblioteca no tiene ningún chequeo de permisos
- **Dónde:** `backend-tecApp/src/modules/biblioteca/biblioteca-router.js`, `prestamos-router.js`, `recursos-router.js` → **0 ocurrencias de `comprobarPermiso`**.
- **Qué pasa:** están montados con `autenticar` (cualquier sesión válida), sin autorización por rol. Un alumno autenticado puede `POST`, `PATCH` y `DELETE` de `biblioteca`, `biblioteca/prestamos` y `biblioteca/recursos`.
- **Impacto:** un estudiante puede borrar libros, préstamos y recursos.

### HIGH-2 — Lecturas de comunidad sin filtrado por permiso
- **Dónde:** `backend-tecApp/src/modules/comunidad/comunidad-router.js`: `GET /noticias`, `GET /comunicados`, `GET /objetos-perdidos` y **`GET /monitoreo`** no llevan `comprobarPermiso`.
- **Impacto:** cualquier usuario autenticado puede leer comunicados dirigidos a personal/curso, y **el historial global de emails** (`/api/comunidad/monitoreo`), que la UI muestra sólo en el panel de administración.

### HIGH-3 — `comprobarPermisos()` sin argumento = sin control
- **Dónde:** `backend-tecApp/src/middlewares/comprobarPermisos.js` (`if (!permisoRequerido) return next();`) + uso en `comunidad-router.js` para `POST/PUT/DELETE /objetos-perdidos`.
- **Impacto:** cualquier usuario autenticado puede crear, modificar y **eliminar** cualquier reporte de objeto perdido. El middleware "abre la puerta" en lugar de fallar cerrado; conviene que un permiso vacío sea un error de configuración.

### HIGH-4 — Imágenes subidas sin control de acceso y persistentes mal
- **Dónde:** `backend-tecApp/src/server.js` sirve `express.static(uploadDir)` en `/uploads` y `/api/comunidad/uploads` sin autenticación; `docker-compose.yml` **no declara volumen para `uploads/`** (sólo `db_data`).
- **Impacto:** (a) cualquiera puede enumerar/descargar imágenes por URL; (b) las imágenes de noticias se **pierden al recrear el contenedor** del backend (se escriben dentro del contenedor efímero).

---

## 4. 🟡 Problemas medios

| # | Hallazgo | Evidencia |
|---|---|---|
| MED-1 | **CORS abierto** (`app.use(cors())` sin orígenes permitidos) | `backend-tecApp/src/server.js` |
| MED-2 | **Sin rate limiting ni `helmet`**; sin librería de validación de entrada | `backend-tecApp/package.json` (no figuran `express-rate-limit`, `helmet`, `zod`/`joi`) |
| MED-3 | **Logs con datos sensibles**: se imprime el body completo del login (contraseña en texto plano) y de registros | `auth-router.js` (`console.log("USUARIO:", req.body)`), `comunidad-router.js` (`console.log(req.body)` en POST noticias) |
| MED-4 | **DDL al arrancar**: se crean/alteran tablas al iniciar el server, sin migraciones reales en el backend activo | `server.js` importa `db/ensureCorreosTable.js` y `db/ensureLibretaDigital.js` |
| MED-5 | **Secret JWT de desarrollo** con guarda sólo si `NODE_ENV === "production"`; el `docker-compose.yml` **no define `NODE_ENV`** ni `JWT_SECRET` | `backend-tecApp/src/utils/jwtSecret.js`, `docker-compose.yml` |
| MED-6 | **Credenciales por defecto en la configuración**: `MYSQL_ROOT_PASSWORD=root_pass` en el compose y `DATABASE_PASSWORD="root_pass"` + `JWT_SECRET` en `.env.example` | `docker-compose.yml`, `backend-tecApp/db/.env.example` |
| MED-7 | **phpMyAdmin expuesto** en `:8000` con `PMA_ARBITRARY=1` y MySQL en `:3306` | `docker-compose.yml` |
| MED-8 | **Contratos de error inconsistentes**: convive `{ error }`, `{ message }`, `{ ok:false, error }`, `{ success:false, message }`; el módulo biblioteca devuelve 400/404 genéricos con el objeto de error crudo (filtra internos) y no hay handler de 404 | routers de `biblioteca`, `usuarios`, `comunidad`, `auth` |
| MED-9 | **Sin interceptor de respuesta en el frontend**: un token expirado genera 401 sueltos en cada vista, sin logout/redirección automática | `frontend-tecApp/src/main.js` (sólo interceptor de request) |
| MED-10 | **Sin tests en el backend activo ni CI**: las 5 suites de backend viven sólo en la copia ignorada `cambios-pendientes/`; no existe `.github/workflows` | `backend-tecApp/` (sin `test/`), ausencia de CI |

---

## 5. 🔵 Deuda técnica y calidad

1. **`dist/` versionado (22 archivos)** — artefactos de build en git; cada `npm run build` modifica archivos rastreados y genera ruido/deletes en el estado del repo.
2. **Backend legado rastreado**: `old-backend/` (102 archivos, gateway y servicios viejos) sin uso aparente.
3. **248 MB en `cambios-pendientes/`** (incluye un `.rar` y copias completas de backend/frontend), ignorado por git pero presente en el workspace.
4. **Tokens reales en el disco**: `token.txt` y `token2.txt` (JWT de ~3 KB cada uno). Están *gitignored*, pero no deberían quedar en la carpeta de trabajo.
5. **Duplicación masiva en el frontend**: componentes de 35–49 KB y **490–676 líneas de CSS duplicado por vista** (se repiten `.card`, `.mini`, `.tb-btn`, `.modal-*`, `.metric-*`, formularios completos por CRUD).
6. **Rol `administrativo` huérfano en el frontend**: `ROL_ROUTES` (`frontend-tecApp/src/services/auth-service.js`) no lo incluye → tras el login cae al fallback `/`; además el guard del dashboard exige `role: "root"` (`router.js`), así que un administrativo con permisos `administrativo_*` **no puede entrar al panel** aunque el backend se los permita.
7. **IDs de rol mágicos** repartidos en el código (`8` root, `1` alumno, `3` profesor, `4` preceptor, `7` administrativo) en routers, controladores y frontend: cualquier cambio del seed rompe lógica silenciosa.
8. **Accesibilidad y consistencia visual**: aún quedan textos de 10–11 px con grises de bajo contraste, y el módulo admin ya fue mejorado pero los módulos de alumno/profesor/preceptor/bibliotecario mantienen patrones distintos.
9. **URL de API con fallback hardcodeado** (`http://localhost:9000/api`) en `frontend-tecApp/src/composables/useProfesor.js`, distinto del resto que usa `/api` + proxy.
10. **Bundle único de ~570 KB** sin code-splitting (advertencia del build de Vite).

---

## 6. ✅ Lo que está bien (mantener)

- **Permisos granulares y correctos en el núcleo académico**: notas, asistencias, alumnos, cursos, materias, personal y usuarios tienen `comprobarPermiso` por operación (7–12 chequeos por router).
- **Verificaciones de pertenencia reales** en notas (`obtenerHistorialAlumno` valida alumno propio / preceptor de su curso; `modificarNota` verifica que el profesor posea la asignación) — es el patrón a replicar en biblioteca y comunidad.
- **Hash de contraseñas con bcrypt** y migración progresiva de contraseñas legacy (`comprobarContrasenaUsuario`).
- **Consultas parametrizadas** donde hay SQL crudo (`email-controller.js` usa `replacements`), y SQL crudo limitado a DDL/seed.
- **Uploads con filtro de tipo MIME y límite de 5 MB** (`middlewares/uploads.js`).
- **`ErrorHandler` centralizado** + handler de errores global en `server.js`.
- **Guardas sensatas en la configuración**: el secret JWT obliga a definirlo en producción.
- **Mejoras recientes del panel admin**: sistema de toasts, modales accesibles unificados, vista sincronizada con URL, sidebar responsive, sorting/filtros/export CSV, `aria-sort`, perfil con cambio de contraseña verificado y 33 tests unitarios.

---

## 7. ¿Qué se le puede agregar al sistema?

### 7.1 Prioridad 0 — Hardening (bloquea salida a producción)
- Cerrar CRIT-1 y CRIT-2; permisos en biblioteca (HIGH-1) y lecturas de comunidad (HIGH-2); corregir `comprobarPermisos()` para fallar cerrado.
- `rate limiting` en `/api/auth/login`, `/api/usuarios/usuarios/login` y `/registro`; `helmet`; CORS con lista blanca.
- Validación/sanitización de entrada con esquema (Zod/Joi) y límite de body.
- Volumen Docker para `uploads/`, `NODE_ENV=production` y secretos por variables de entorno obligatorias; sacar phpMyAdmin/MySQL de puertos públicos.
- Limpiar logs sensibles; verificación de contraseña con `bcrypt.compare` antes de modificar; borrar `token*.txt`.

### 7.2 Prioridad 1 — Robustez y observabilidad
- Migraciones formales con `sequelize-cli` (ya hay scripts) + backups automáticos.
- Logs estructurados (pino) con `request-id`, sin datos personales; healthchecks de backend/frontend.
- Interceptor de respuesta 401/403 en el frontend → logout y mensaje único; refresh token o renovación deslizante.
- Tests de backend en el proyecto activo + **CI** (lint, unit, build) en cada push.
- Unificar contratos de API (`{ ok, data, error }`) y el handler de 404.

### 7.3 Prioridad 2 — Producto (nuevas capacidades)
- **Auditoría visible**: pantalla de historial de acciones (ya existe `historial-notas`) para quién cambió notas, asistencias y usuarios.
- **Boletines/constancias en PDF** y exportaciones generalizadas (el CSV ya está en 3 vistas).
- **Portal de tutores** (hoy el rol existe en el modelo pero sin dashboard propio) y notificaciones de inasistencias.
- **Notificaciones**: push/email desde comunicados/noticias (el historial de correos ya está modelado).
- **Búsqueda global** en el panel (alumnos, cursos, usuarios) y **calendario escolar**.
- **Biblioteca self-service**: reserva/renovación por el alumno, con reglas y permisos correctos.
- **Dashboard analítico**: tendencias de matrícula, asistencia y promoción por curso (evolución del Overview actual).
- **Modo oscuro** (los tokens CSS ya están preparados) y **PWA/offline** para consulta de libreta.

### 7.4 Prioridad 3 — Calidad de código
- Sistema de diseño compartido (Storybook) y eliminar el CSS duplicado de las vistas.
- Code-splitting por ruta y paginación server-side para padrones grandes.
- E2E con Playwright (ya hay una carpeta `.playwright-mcp` de trabajo local) para los flujos críticos: login, alta de alumno, carga de notas, préstamo.
- Contrato OpenAPI/Swagger para que frontend y backend evolucionen coordinados.
- Alinear roles: unificar `root`/`administrativo`, sacar IDs mágicos y hacer que el guard del dashboard use **permisos** en lugar de nombres de rol.

---

## 8. Plan de acción sugerido

| Prioridad | Acción | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | Cerrar `PATCH /api/auth/auth/` y el `id_rol` del registro | Crítico | Bajo |
| 2 | Permisos en biblioteca + lecturas de comunidad + `comprobarPermisos` cerrado | Alto | Bajo-Medio |
| 3 | Rate limiting, helmet, CORS, validación de entrada | Alto | Medio |
| 4 | NODE_ENV + JWT_SECRET obligatorios, volumen de uploads, cerrar puertos | Alto | Bajo |
| 5 | Quitar logs con datos sensibles y `token*.txt` | Medio | Bajo |
| 6 | Interceptor 401 + logout en frontend | Medio | Bajo |
| 7 | Alinear rol `administrativo` con el dashboard (por permisos) | Medio | Bajo |
| 8 | Tests de backend + CI | Medio | Medio |
| 9 | Migraciones formales y dejá de hacer DDL al arrancar | Medio | Medio |
| 10 | Deduplicación de CSS/componentes + code-splitting | Bajo | Alto |

---

## 9. Cómo se verificó (trazabilidad)

- Rutas y montaje público/privado: lectura de `server.js` y de los 18 `*-router.js`.
- Autorización: conteo de `comprobarPermiso`/`autenticar` por router y lectura de `middlewares/comprobarPermisos.js`.
- Credenciales y tokens: `utils/jwtSecret.js`, `modules/auth/auth-controller.js`, `.env.example`, `docker-compose.yml`.
- Control de pertenencia: `notas-controller.js` (`obtenerHistorialAlumno`, `modificarNota`).
- Datos sensibles en disco: `git check-ignore` sobre `token*.txt` (ignorados, pero presentes) y tamaño (3.125 bytes c/u).
- Configuración y persistencia: `docker-compose.yml` (sin volumen de `uploads`, puertos expuestos, sin `NODE_ENV`).
- Estado del repositorio: `git ls-files` (dist 22 archivos, old-backend 102, sin CI), tamaño de `cambios-pendientes` (248 MB).
- Frontend: `router/router.js` (guards por rol), `services/auth-service.js` (`ROL_ROUTES` sin `administrativo`), `main.js` (sólo interceptor de request), conteo de LOC y de líneas de estilo por vista.

> **Nota:** este informe es de solo lectura. Los dos archivos creados (`INFORME-AUDITORIA-SISTEMA.md` y `.txt`) son nuevos y no modifican código existente. Si querés, se puede excluirlos del repo agregándolos al `.gitignore` cuando lo decidas.
