# Informe de cambios — Rama temporal `temp/auditoria-hardening`

**Fecha:** 26/09/2026
**Rama de origen:** `dev`
**Rama de trabajo:** `temp/auditoria-hardening` (no se tocaron `dev` ni `main`)
**Base:** auditoría previa (`INFORME-AUDITORIA-SISTEMA.md` / `.txt`)

---

## 1. Resumen ejecutivo

Se aplicaron **16 cambios** de seguridad, consistencia y calidad sobre los hallazgos de la
auditoría. Los tres hallazgos más graves (CRIT-1, CRIT-2, ALTO-1..4) quedaron **corregidos**,
se agregó **endurecimiento de infraestructura** y **tests** tanto en backend como en frontend.

Verificación al cierre:

| Verificación | Resultado |
|---|---|
| Tests backend (`node --test`) | **13/13** ✅ |
| Tests frontend (`vitest run`) | **33/33** ✅ |
| Build de producción (`vite build`) | ✅ OK |
| `node --check` en archivos backend modificados | ✅ OK |

---

## 2. Cambios por archivo

### 2.1 Backend — Seguridad crítica

**`backend-tecApp/src/modules/auth/auth-router.js`**
- **CRIT-1:** se **eliminó** la ruta pública `PATCH /api/auth/auth/`. Permitía cambiar
  email, contraseña y `id_rol` (incluido root) de cualquier usuario **sin autenticación**.
  La edición legítima sigue disponible en `PATCH /api/usuarios/usuarios` (protegido por
  `administrativo_editar_usuario`) o desde el propio perfil.
- **CRIT-2:** `POST /verificar-codigo` ya **no acepta `id_rol` del cliente**. El rol se
  deriva del padrón validado (`derivarRolDesdePadron`). Si no se puede determinar, responde 400.
- Se eliminó el `console.log(req.body)` de login y verificar-código (logueaba contraseñas).
- La sincronización post-registro ahora distingue `profesor`, `alumno` y no rompe con otros roles.

**`backend-tecApp/src/utils/rolPadron.js`** *(nuevo)*
- `ROLES_SISTEMA` (IDs del seed) y `ROLES_PADRON` (alumno/profesor/administrativo, **sin root**).
- `derivarRolDesdePadron()` — única fuente para asignar rol en el auto-registro.

**`backend-tecApp/src/utils/permisosConfig.js`** *(nuevo)*
- `SOLO_AUTENTICADO` (Symbol) para marcar rutas que solo requieren sesión.
- `normalizarListaPermisos()` — normaliza string/array; devuelve `null` si la config es inválida.

**`backend-tecApp/src/middlewares/comprobarPermisos.js`** *(reescrito)*
- **ALTO-3:** el middleware antes hacía `if (!permisoRequerido) return next()`, es decir,
  **acceso libre si se olvidaba el argumento**. Ahora es **fail-closed**: sin permiso explícito
  y sin `soloAutenticado` responde 500 (error de configuración, nunca apertura).
- `obtenerPermisosDeRol` dejó de devolver `[]` silencioso ante errores de DB (evitaba 403 engañosos).
- Se eliminó el bypass por `id_rol` hardcodeado; root pasa por tener todos los permisos en el seed.

### 2.2 Backend — Autorización de módulos

**Biblioteca (`biblioteca-router.js`, `prestamos-router.js`, `recursos-router.js`)** — *ALTO-1*
- Todas las rutas pasaron de **sin permiso** a permisos `biblio_*`:
  `biblio_ver_recursos`, `biblio_crear_recurso`, `biblio_editar_recurso`,
  `biblio_eliminar_recurso`, `biblio_ver_prestamos`, `biblio_crear_prestamo`,
  `biblio_editar_prestamo`.
- Lecturas de catálogo usan `soloAutenticado` explícito (comportamiento actual, pero declarado).
- Respuestas de error unificadas a `{ ok:false, error, message }` con status correcto.
- Se removió el `console.log` del body de recursos.

**Comunidad (`comunidad-router.js`)** — *ALTO-2 / ALTO-3*
- `GET /monitoreo` y `POST /marcar-leido` ahora exigen
  `root_ver_logs_sistema` o `administrativo_ver_reportes` (antes: cualquier autenticado veía
  el historial global de emails).
- `POST /objetos-perdidos` → `soloAutenticado` explícito (feature de alumnos).
- `PUT`/`DELETE /objetos-perdidos/:id` → `administrativo_ver_reportes` o
  `root_eliminar_cualquier_contenido` (antes abiertos).
- Se removieron logs del body de noticias.

### 2.3 Backend — Endurecimiento del servidor

**`backend-tecApp/src/server.js`**
- `helmet()` con CSP desactivada (es API JSON) y `crossOriginResourcePolicy: cross-origin`
  (para poder mostrar imágenes en otro origen).
- `app.set("trust proxy", 1)` para que el rate-limit vea la IP real detrás de Docker/nginx.
- **`express-rate-limit`:** 60 req/15 min para `/api/auth` y **10 req/15 min** para
  `/api/auth/login` y `/api/auth/verificar-codigo` (fuerza bruta).
- **CORS con allowlist** (`CORS_ORIGINS` en CSV); en producción una lista vacía rechaza
  orígenes cruzados.
- **Límite de body JSON** (`JSON_BODY_LIMIT`, por defecto `1mb`).
- **Uploads endurecidos** *(ALTO-4)*: lista blanca de extensiones (imágenes y PDF),
  `dotfiles: "deny"`, sin listado de directorios, `maxAge` en producción.
  Nota de diseño: la **lectura** sigue siendo pública porque las imágenes se consumen vía
  `<img src>`, que no puede enviar el header `Authorization`.
- **Handler 404 uniforme** y endpoint público `GET /api/health` (para healthchecks).

**`backend-tecApp/src/utils/jwtSecret.js`**
- Exige `JWT_SECRET` cuando `NODE_ENV` no es `development`/`test` (antes solo en `production`).
- Advertencia visible una vez cuando cae al secreto de desarrollo.

**`backend-tecApp/src/db/conexionDB.js`**
- En producción **exige `DATABASE_URL`**; ya no cae silenciosamente a `root:root_pass@mysql-db`.

### 2.4 Backend — Tests

- **`backend-tecApp/tests/permisosConfig.test.js`** (8 tests) y
  **`backend-tecApp/tests/rolPadron.test.js`** (5 tests). Total **13 tests**.
- Nuevo script `npm test` → `node --test` en `backend-tecApp/package.json`.
- Se verificó explícitamente que **NUNCA** se pueda escalar a root desde el padrón.

### 2.5 Frontend

**`frontend-tecApp/src/main.js`**
- **Interceptor de respuestas 401:** si hay token presente y el backend responde 401,
  limpia la sesión y redirige al login con `?redirect=`. Evita pantallas rotas por sesión vencida.
  No afecta el 401 de credenciales inválidas en login (no hay token aún).

**`frontend-tecApp/src/services/auth-service.js`**
- `ROL_ROUTES` incluye `administrativo` (→ `/unauthorized`, ya que todavía no tiene panel
  propio; antes caía en `/` sin contexto) y `bibliotecario` (→ `/biblioteca/dashboard`).

**`frontend-tecApp/src/composables/useProfesor.js`**
- URL de API por defecto pasa de `http://localhost:9000/api` a la **relativa `/api`**
  (usa el proxy de Vite/Nginx en lugar de una URL hardcodeada).

### 2.6 Infraestructura / CI

**`docker-compose.yml`**
- **Volumen `uploads_data`** para `/app/uploads` (antes las imágenes se perdían al recrear).
- `NODE_ENV=production` por defecto en el backend.
- `MYSQL_ROOT_PASSWORD` **obligatorio** (`${MYSQL_ROOT_PASSWORD:?…}`), sin `root_pass` por defecto.
- Healthcheck de MySQL coherente con la variable de entorno; `backend` espera a `mysql-db` sano.
- MySQL y phpMyAdmin expuestos **solo en `127.0.0.1`** (ya no en la red pública).

**`backend-tecApp/db/.env.example`**
- Documenta `MYSQL_ROOT_PASSWORD`, `NODE_ENV`, `JWT_SECRET`, `CORS_ORIGINS`,
  `UPLOADS_DIR` y `JSON_BODY_LIMIT`.

**`.github/workflows/ci.yml`** *(nuevo)*
- Job **backend**: `npm ci` + `npm test`.
- Job **frontend**: `npm ci` + `npm test` + `npm run build`.
- Se dispara en `push` y `pull_request` a `dev` y `main`.

**Dependencias:** se agregaron `helmet` y `express-rate-limit` al backend.

---

## 3. Verificación (evidencia)

```
backend-tecApp  $ npm test
ℹ tests 13   ℹ pass 13   ℹ fail 0

frontend-tecApp $ npm test
Test Files  6 passed (6)
Tests       33 passed (33)

frontend-tecApp $ npm run build
✓ 228 modules transformed.
✓ built in 6.15s

backend-tecApp  $ node --check <archivos modificados>
OK en server.js, conexionDB.js, jwtSecret.js, permisosConfig.js, rolPadron.js,
comprobarPermisos.js, recursos-router.js, biblioteca-router.js, prestamos-router.js,
auth-router.js, comunidad-router.js
```

---

## 4. Decisiones de diseño relevantes

1. **Uploads públicos (con lista blanca).** Protegerlos con JWT rompería las imágenes de
   noticias (`<img src>` no envía headers). Se optó por endurecer el serving sin romper la UI.
   Una solución completa requeriría URLs firmadas o un proxy autenticado.
2. **Rutas abiertas por olvido ahora fallan cerrado** (500), no abren. Es intencional y
   ruidoso para detectar configuraciones mal hechas en tests.
3. **Rol administrativo** se redirige a `/unauthorized` con la guard actual (el panel exige
   `root`). Crear su dashboard y filtrar el sidebar por permisos queda como trabajo futuro.
4. **`dist/` sigue versionado.** No se sacó de git en esta rama por no arriesgar despliegues
   que lo consuman; se recomienda moverlo a build de CI.

---

## 5. Pendientes recomendados (no aplicados)

- Sacar `frontend-tecApp/dist/` del control de versiones y agregarlo a `.gitignore`.
- Eliminar `old-backend/` (102 archivos) y `cambios-pendientes/` (~248 MB).
- Filtrar el `Sidebar` del admin por permisos para habilitar el rol administrativo.
- Añadir tests de integración del backend (rutas/middlewares con supertest).
- Code-splitting para bajar el bundle (~586 KB / 168 KB gzip).
- Rotar `token.txt` / `token2.txt` si contienen JWT reales.

---

## 6. Cómo revisar / integrar

```bash
git switch temp/auditoria-hardening
git diff dev --stat            # ver alcance
cd backend-tecApp && npm test  # 13/13
cd ../frontend-tecApp && npm test && npm run build
```

Para integrar: merge/fast-forward de `temp/auditoria-hardening` sobre `dev` cuando se valide.
