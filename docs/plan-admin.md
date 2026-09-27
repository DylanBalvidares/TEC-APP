# Plan de implementación — Vista de administrador (TEC-APP)

> Estado: **propuesta pendiente de aprobación**. Creado: 2026-09-27 · Rama base: `dev`.
> Alcance: panel de administración (`frontend-tecApp/src/components/administrador/`)
> y su backend (`backend-tecApp/src/modules/{usuarios,academico,comunidad,biblioteca}`).
> Regla del plan: **cada ítem se testea; si el test pasa, se commitea** con
> Conventional Commits. Un ítem = un commit atómico.
>
> **Fuera de alcance:** no se tocan los workflows de `.github/workflows/` y el plan
> **no depende de CI**. Toda la validación es local (backend `npm test`, frontend
> `npm test` + `npm run build`) y el merge a `dev` se hace a mano tras el gate.
>
> Este documento **no modifica código**: es el plan de ejecución derivado del
> análisis de la vista de administrador.

## Índice

1. [Estado verificado del repositorio](#1-estado-verificado-del-repositorio)
2. [Reglas del gate (test → commit)](#2-reglas-del-gate-test--commit)
3. [Fase -1: preparación del árbol de trabajo](#3-fase--1-preparación-del-árbol-de-trabajo)
4. [Fase 0: infraestructura de test](#4-fase-0-infraestructura-de-test)
5. [Fase 1: seguridad](#5-fase-1-seguridad)
6. [Fase 2: quick wins de producto](#6-fase-2-quick-wins-de-producto)
7. [Fase 3: consolidación](#7-fase-3-consolidación)
8. [Fase 4: estratégica](#8-fase-4-estratégica)
9. [Matriz de trazabilidad](#9-matriz-de-trazabilidad)
10. [Resumen de ejecución](#10-resumen-de-ejecución)

---

## 1. Estado verificado del repositorio

Relevado antes de planificar (comandos ejecutados sobre el árbol actual):

| Dato | Valor real |
|---|---|
| Tests backend | `cd backend-tecApp && npm test` → **`node --test`**. Tests puros de utils (`permisosConfig`, `planesReglas`, `rolPadron`, `whatsappProvider`). Sin `supertest`, sin MySQL. |
| Tests frontend | `cd frontend-tecApp && npm test` → **`vitest run`** (config en `vitest.config.js`: `jsdom`, `globals`, `include: ["tests/**/*.test.js"]`). |
| Build frontend | `cd frontend-tecApp && npm run build` (Vite 5, base `/frontend-tecApp/`). |
| CI / workflows | **Fuera de alcance.** El plan no modifica `.github/workflows/` ni depende de un runner: la validación es local (backend `npm test`; frontend `npm test` + `npm run build`). |
| Estilo de commits | `tipo(alcance): descripción en imperativo, minúscula, sin acentos` (ej. `fix(security): fail-closed en comprobarPermiso + permisos en biblioteca/comunidad`). |
| Ramas | `dev` es la rama activa; `main` es estable; las ramas `temp/*` son temporales y se eliminan tras mergear. |
| Precedente de tests | Existen suites en `backend-tecApp/tests/` (4 archivos, `node:test`) y `frontend-tecApp/tests/` (10 archivos, vitest) con patrones reutilizables: mocks de `axios`, router en memoria, Pinia activa y mocks de servicios por módulo. |
| Patrón de migración de esquema | `src/db/ensure*.js` (`ensureCorreosTable`, `ensureLibretaDigital`, `ensurePlanesEstudio`, `ensureMensajesWhatsapp`): `CREATE TABLE IF NOT EXISTS` + `INSERT IGNORE` de permisos + `rol_permisos`, porque el SQL de init no se re-ejecuta con volumen existente. |

**Bloqueante detectado:** `git status` reporta **19 archivos modificados sin commitear**
(altas de WhatsApp en `comunidad-router`, `mensajes-*`, dashboards y `router.js`).
Mientras eso siga así, ningún commit puede ser atómico: hay que resolverlo en la Fase -1.

---

## 2. Reglas del gate (test → commit)

Aplican a **todos** los ítems de todas las fases.

1. **Un ítem = un commit atómico**, y el test del ítem viaja en el mismo commit.
2. **Secuencia obligatoria por ítem:**

```bash
# 1) rama de trabajo desde dev actualizado
git checkout dev && git pull
git checkout -b temp/<alcance>-<slug>

# 2) implementar el cambio + escribir el test del ítem
# 3) gate local (debe pasar antes de commitear)
cd backend-tecApp  && npm test
cd frontend-tecApp && npm test          # + npm run build si tocó frontend
cd ..

# 4) commit SOLO si el gate pasa
git add <archivos-del-item>
git commit -m "<tipo>(<alcance>): <descripcion>"

# 5) merge local a dev (sin PR ni CI)
git checkout dev
git merge --no-ff temp/<alcance>-<slug>
git branch -d temp/<alcance>-<slug>
```

3. **Si el test falla:** no se commitea. Se corrige dentro del mismo ítem; si no es
   viable, se revierte (`git checkout -- <archivo>`) y el ítem queda **bloqueado**
   con el motivo exacto. Nunca se commitea un test en rojo, ni se lo saltea con
   `.skip`, ni se lo deshabilita para que el gate pase.
4. **Gate local obligatorio**, antes de commitear y antes de mergear: suite completa
   en verde (`npm test` en backend; `npm test` y `npm run build` en frontend), no solo
   el test nuevo. El merge a `dev` se hace a mano una vez que el gate pasa. El plan
   **no depende de CI** ni modifica workflows.
5. **Higiene del repositorio** (según `docs/tec-app.md`):
   - No commitear `token*.txt`, `consola-profesores.log` ni `backend-tecApp/db/.env`.
   - Si `npm run build` ensucia `frontend-tecApp/dist`, revertirlo con
     `git checkout -- frontend-tecApp/dist`, salvo que el ítem sea explícitamente
     un `chore(build):` de regeneración de artefactos.
   - Recordar que el `dist/` está versionado: los diffs de build no deben mezclarse
     con commits de features.
6. **Prohibido tocar** `old-backend/`, `cambios-pendientes/` (legado y copia de
   trabajo, ignorada por git, pendientes de limpieza) y los workflows de `.github/`.
7. **Plantilla de mensaje** (por si el ítem necesita detalle):

```
tipo(alcance): descripcion breve en imperativo

Que cambia y por que. No se mencionan datos sensibles.
Refs: hallazgo <ID del analisis>
```

**Tipos:** `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`.
**Alcances sugeridos:** `security`, `admin`, `api`, `ui`, `roles`, `db`, `a11y`,
`services`, `reportes`, `config`, `horarios`, `convivencia`, `notificaciones`,
`documentos`, `infra`, `auth`, `alumnos`, `usuarios`, `build`.

---

## 3. Fase -1: preparación del árbol de trabajo

**Ítem 0 — Settlear el WIP de WhatsApp (no es código nuevo del plan).**

```bash
git checkout -b temp/wip-whatsapp
git add -A
git commit -m "feat(whatsapp): historial, reenvio y diagnostico de mensajes"
git checkout dev
git merge --no-ff temp/wip-whatsapp
git branch -d temp/wip-whatsapp
```

- **Alternativa sin commitear todavía:** `git stash push -u -m "wip whatsapp"` y
  recuperarlo después. Pero no se puede convivir con la política de commit atómico.
- **Test/gate:** `cd backend-tecApp && npm test` y `cd frontend-tecApp && npm test`
  deben estar en verde **antes** de crear la rama, para saber que el punto de
  partida es sano.
- **Evidencia esperada:** `git status --short` vacío (o solo lo que esté
  explícitamente ignorado) antes de arrancar el ítem T0.1.

---
## 4. Fase 0: infraestructura de test

Sin esta fase no se pueden testear rutas (los tests actuales solo cubren utils puros).

### T0.1 — Poder importar modelos sin conectar a la base

- **Dolor:** `backend-tecApp/src/db/conexionDB.js` llama `intentarConexion()` en el
  import y reintenta cada 5 s con `setTimeout`, por lo que cualquier test que importe
  un modelo abre una conexión real a MySQL y cuelga la suite (el entorno de tests no
  tiene base disponible).
- **Cambio:** ejecutar la conexión solo fuera de test:
  `if (process.env.NODE_ENV !== "test" && process.env.SKIP_DB_CONNECT !== "1") intentarConexion();`
  y exportar `intentarConexion` para poder testearla.
- **Test:** `backend-tecApp/tests/conexionDB.test.js` — con `NODE_ENV=test` el import
  devuelve una instancia de `Sequelize` usable y no deja handles pendientes.
- **Gate:** `cd backend-tecApp && NODE_ENV=test npm test`.
- **Commit:** `test(db): permitir importar modelos sin conexion real en tests`

### T0.2 — Extraer `app` de `server` para poder testear rutas

- **Dolor:** `server.js` hace `app.listen(...)` en el import → imposible montar la app
  con supertest.
- **Cambio:** nuevo `backend-tecApp/src/app.js` que exporta la app Express (helmet,
  CORS, body limit, log, estáticos, routers por módulo, 404 uniforme y error handler);
  `server.js` queda solo con el `listen` y el arranque de los `ensure*`. Añadir
  `supertest` como `devDependency` (instalar con `npm install` para actualizar
  `package-lock.json`).
- **Test:** `backend-tecApp/tests/app.test.js` — `GET /api/health` → 200; ruta
  inexistente → 404 `{ ok:false, error:"Ruta no encontrada" }`; `GET /api/academico/alumnos`
  sin token → 401.
- **Gate:** `cd backend-tecApp && npm test` + smoke manual
  `docker compose up -d --build && curl -s localhost:9000/api/health`.
- **Commit:** `test(app): extraer app de server y cubrir health y 404 con supertest`

### T0.3 — Guardrail de permisos por ruta (detector de los bugs de la Fase 1)

- **Dolor:** el sistema ya se rompió por rutas sin `comprobarPermiso` (`cargos`,
  `alumnos/validar-identidad`, `usuarios/login`, GETs de comunidad).
- **Cambio:** `backend-tecApp/tests/rutas-permisos.test.js` que recorre
  `src/modules/**/*-router.js`, extrae cada registración `router.<verbo>("...", ...)` y
  falla si el bloque no incluye `comprobarPermiso(`, `comprobarPermisos(` o el marcador
  `soloAutenticado`. Debe existir una allowlist explícita (con comentario) para
  excepciones justificadas.
- **Test:** el propio archivo. Al inicio **falla a propósito** listando las rutas hoy
  desprotegidas (evidencia del bug) y queda verde al cerrar S1–S5.
- **Gate:** `cd backend-tecApp && npm test`.
- **Commit:** `test(security): guardrail que exige permiso explicito en cada ruta`

---
## 5. Fase 1: seguridad

Bugs críticos detectados en el análisis. Orden: S1 → S2 → S3 → S4 → S5 → S6 → S7.

### S1 — `cargos` sin ningún control de permisos

- **Evidencia:** `backend-tecApp/src/modules/academico/cargos-router.js`: los cinco
  endpoints (`GET /cargos`, `GET /cargos/:id`, `POST /cargos`, `PATCH /cargos/:id`,
  `DELETE /cargos/:id`) no invocan `comprobarPermiso` → cualquier usuario autenticado
  (alumno, tutor) puede crear, modificar o borrar cargos.
- **Cambio:**
  - GETs → `comprobarPermiso(["administrativo_ver_cargos", "root_gestionar_cargos"])`.
  - POST/PATCH/DELETE → `comprobarPermiso("root_gestionar_cargos")`.
  - Nuevo `src/db/ensureCargos.js` (patrón `ensureMensajesWhatsapp.js`): `INSERT IGNORE`
    de ambos permisos en `permisos` y asignación a root (rol 8) en `rol_permisos`;
    registrar el módulo en `server.js` junto a los otros `ensure*`.
  - Agregar las mismas líneas a `db/gestion_tecnica2.sql` para instalaciones nuevas.
- **Test:** `backend-tecApp/tests/cargos-permisos.test.js` con supertest — sin token → 401;
  token de alumno → 403; root → 200/201; más T0.3 en verde para este router.
- **Gate:** `cd backend-tecApp && npm test` + `docker logs backend-tec-app` sin errores del ensure.
- **Commit:** `fix(security): exigir permisos en cargos y sumar catalogo al seed`
- **Refs:** hallazgo 2.1.1

### S2 — Fuga de hashes de contraseña

- **Evidencia:** `modules/usuarios/usuarios-controller.js` — `obtenerTodosUsuarios`,
  `obtenerUsuario` y `buscarUsuarioPorEmail` no excluyen la columna `contrasena`, por lo
  que `GET /api/usuarios/usuarios` devuelve los hashes bcrypt en el JSON.
- **Cambio:** agregar `attributes: { exclude: ["contrasena"] }` en las tres consultas.
  No tocar `comprobarContrasenaUsuario`, que sí necesita el campo.
- **Test:** `backend-tecApp/tests/usuarios-contrasena.test.js` — (a) unitario con
  `mock.method(Usuario, "findAll")` verificando el argumento `attributes.exclude`;
  (b) supertest: la respuesta de `GET /api/usuarios/usuarios` no contiene la clave
  `contrasena` en ningún elemento.
- **Gate:** `cd backend-tecApp && npm test`.
- **Commit:** `fix(security): no exponer hashes de contrasena en usuarios`
- **Refs:** hallazgo 2.1.2

### S3 — Login interno abierto y sin límite

- **Evidencia:** `modules/usuarios/usuarios-router.js` — `POST /usuarios/login` sin
  permiso explícito (viola la regla fail-closed del proyecto) ni rate-limit propio, fuera
  del limitador de `/api/auth`.
- **Cambio:** `comprobarPermiso(soloAutenticado)` explícito + `rateLimit` 10/15 min +
  validar que el `email` consultado sea el del token, salvo actor root (el caso de uso es
  “verificá tu propia contraseña” en `UsuarioPerfil.vue`).
- **Test:** `backend-tecApp/tests/usuarios-login-interno.test.js` — 200 con credenciales
  propias; 403 al consultar el email de otro usuario; 429 al superar 10 intentos.
- **Gate:** `cd backend-tecApp && npm test`.
- **Commit:** `fix(security): blindar login interno con permiso, limite y verificacion de identidad`
- **Refs:** hallazgo 2.1.3

### S4 — Escrituras sin permiso explícito en alumnos

- **Evidencia:** `modules/academico/alumnos-router.js` — `POST /alumnos/validar-identidad`
  y `PATCH /alumnos/sincronizar-usuario-alumno` sin `comprobarPermiso`.
- **Cambio:** `validar-identidad` →
  `comprobarPermiso(["administrativo_ver_todos_alumnos", "preceptor_ver_perfil_alumno"])`;
  `sincronizar-usuario-alumno` →
  `comprobarPermiso(["administrativo_crear_alumno", "administrativo_editar_alumno"])`.
- **Test:** `backend-tecApp/tests/alumnos-permisos.test.js` con supertest — 403 para
  alumno, 200 para root, y que `sincronizar` no permita vincular un alumno a un usuario
  de rol incompatible.
- **Gate:** `cd backend-tecApp && npm test`.
- **Commit:** `fix(security): permiso explicito en validar-identidad y sincronizar usuario-alumno`
- **Refs:** hallazgo 2.1.4

---
### S5 — Lectura de comunidad sin intención declarada

- **Evidencia:** `modules/comunidad/comunidad-router.js` — `GET /noticias`, `/noticias/:id`,
  `/comunicados`, `/comunicados/:id`, `/objetos-perdidos`, `/objetos-perdidos/:id` solo
  pasan por `router.use(autenticar)`, sin permiso: cualquier alumno autenticado recibe el
  historial completo, incluso comunicados dirigidos a otros.
- **Cambio:** marcar `comprobarPermisos(soloAutenticado)` en esos GETs (deja la intención
  explícita y hace pasar el guardrail T0.3) **y** filtrar `GET /comunicados` por `destino`
  según el rol del token.
- **Test:** `backend-tecApp/tests/comunidad-lectura.test.js` — guardrail en verde para el
  router + test de filtrado por destino según rol.
- **Gate:** `cd backend-tecApp && npm test`.
- **Commit:** `fix(security): declarar soloAutenticado y filtrar comunicados por destino`
- **Refs:** hallazgo 2.1.5

### S6 — Noticias sin validación de autoría

- **Evidencia:** `modules/comunidad/noticias-controller.js` — `actualizarNoticia` y
  `eliminarNoticia` no validan autor, aunque el permiso se llame
  `delegado_editar_mis_noticias`.
- **Cambio:** recibir `idUsuario`/`idRol` desde el router y permitir solo si el autor
  coincide o el rol tiene `root_eliminar_cualquier_contenido`.
- **Test:** `backend-tecApp/tests/noticias-autoria.test.js` — 403 si el autor es otro y no
  es root; 200 si es el autor; 200 si es root.
- **Gate:** `cd backend-tecApp && npm test`.
- **Commit:** `fix(security): validar autoria al editar o eliminar noticias`
- **Refs:** hallazgo 2.1.6

### S7 — `autor_id` tomado del body

- **Evidencia:** `noticias-controller.js` — `crearNoticia` usa `datos.autor_id` enviado por
  el cliente.
- **Cambio:** el autor sale de `req.headers["id_usuario"]` (lo inyecta `autenticar`).
- **Test:** `backend-tecApp/tests/noticias-autor.test.js` — enviar un `autor_id` falso y
  verificar que se persiste el del token.
- **Gate:** `cd backend-tecApp && npm test`.
- **Commit:** `fix(security): tomar autor de noticias del token`
- **Refs:** hallazgo 2.1.6

---

## 6. Fase 2: quick wins de producto

Orden sugerido: Q2 → Q1 → Q3 → Q4 → Q5.

### Q1 — Selector de cargos vacío en alta de personal

- **Evidencia:** `PersonalView.vue` declara `listaCargos = ref([])` y nunca la llena,
  aunque `academico-service.js` ya exporta `obtenerCargos`.
- **Cambio:** cargar los cargos en `onMounted` y quitar (o respaldar con datos del cargo)
  el mapeo hardcodeado de roles de `defaultRolIdPersonal`.
- **Test:** `frontend-tecApp/tests/personal-cargos.test.js` (vitest + mock del servicio) —
  el `<select>` renderiza las opciones de la API y el payload enviado incluye `id_cargo`.
- **Gate:** `cd frontend-tecApp && npm test && npm run build`.
- **Commit:** `fix(admin): cargar cargos reales en alta de personal`
- **Refs:** hallazgo 2.2.11

### Q2 — URL errónea en `obtenerCargo`

- **Evidencia:** `academico-service.js` — `obtenerCargo` hace `GET /cargo/${id}` pero el
  backend expone `/cargos/:id`.
- **Cambio:** corregir la ruta del servicio.
- **Test:** `frontend-tecApp/tests/academico-service-cargos.test.js` con `vi.mock("axios")`
  verificando la URL exacta (mismo patrón que `tests/mensajes-service.test.js`).
- **Gate:** `cd frontend-tecApp && npm test`.
- **Commit:** `fix(services): url correcta de obtenerCargo`
- **Refs:** hallazgo 2.2.11

### Q3 — Marcar roles de sistema (fin del 400 sorpresa)

- **Evidencia:** `RolesView.vue` usa `rol.es_sistema`, que no existe ni en el modelo ni en
  la API; el backend rechaza con 400 recién al intentar la acción
  (`roles-controller.js`, `IDS_ROLES_SISTEMA`).
- **Cambio:** (backend) exponer `es_sistema` derivado de `IDS_ROLES_SISTEMA` como fuente
  única; (frontend) mostrar el pill “sistema” y deshabilitar editar/eliminar con tooltip
  explicativo.
- **Test:** `backend-tecApp/tests/roles-sistema.test.js` (es `true` para id ≤ 8, `false`
  para el resto) y `frontend-tecApp/tests/roles-view.test.js` (botones deshabilitados y
  pill visible).
- **Gate:** ambas suites.
- **Commits (2):** `feat(roles): exponer flag es_sistema en la api` y
  `feat(admin): bloquear edicion de roles de sistema en la ui`
- **Refs:** hallazgo 2.2.12

### Q4 — CSS duplicado entre `admin-shared.css` y las vistas

- **Evidencia:** `fadeIn`, `.metrics`, `.metric-card`, `.tb-btn`, `.error-banner` y
  `.badge-*` re-declarados en `AlumnosView.vue`, `Overview.vue`, etc.
- **Cambio:** dejar una sola definición en `admin-shared.css` (ya importado global) y
  borrar los bloques `scoped` duplicados.
- **Test:** `frontend-tecApp/tests/estilos-compartidos.test.js` — test de conformance que
  lee los `.vue` y falla si una vista re-declara `@keyframes fadeIn` o las clases de una
  lista de tokens compartidos (evita la reincidencia).
- **Gate:** `cd frontend-tecApp && npm test && npm run build` + revisión visual de
  Overview, Alumnos y Cursos.
- **Commit:** `refactor(admin): unificar estilos de metricas, badges y animaciones`
- **Refs:** hallazgo 2.3.14

### Q5 — Estado del listado en la URL

- **Evidencia:** `useTableControls` no expone `searchText`, `filters`, `currentPage` ni
  `sortKey` al query string; al cambiar de vista se pierde el contexto.
- **Cambio:** opción `syncUrl: true` en `useTableControls` (`q`, `pag`, `orden`, `dir` y
  filtros por nombre de campo), con `router.replace` debounced y lectura inicial del query.
- **Test:** `frontend-tecApp/tests/table-controls-url.test.js` — con router en memoria:
  escribir en la búsqueda actualiza el query, entrar con `?q=...&pag=2` hidrata el estado y
  limpiar filtros borra los parámetros.
- **Gate:** `cd frontend-tecApp && npm test`.
- **Commit:** `feat(admin): sincronizar busqueda, filtros y pagina con la url`
- **Refs:** hallazgo 2.3.16

---
## 7. Fase 3: consolidación

### C1 — Componente `DataTable.vue` y migración de vistas

- **Cambio:** componente único con búsqueda, filtros, orden, paginación, selección,
  densidad, columnas configurables y estados vacío/error. Migración por lotes:
  (a) Alumnos, Profesores, Personal; (b) Cursos, Materias, Asignaciones, Planes;
  (c) Usuarios, Noticias, Comunicados, MonitorCorreos.
- **Test:** `frontend-tecApp/tests/data-table.test.js` (render, orden, filtros, selección,
  paginación, slot de acciones) + un test de montaje por vista migrada con datos mockeados
  (patrón de `tests/dashboard-nav.test.js`).
- **Gate:** `cd frontend-tecApp && npm test && npm run build`.
- **Commits (4):** `feat(ui): componente DataTable reutilizable` + un
  `refactor(admin): migrar <vistas> a DataTable` por cada lote.
- **Refs:** hallazgos 2.3.14 a 2.3.22

### C2 — Paginación, búsqueda y orden server-side

- **Cambio backend:** helper `src/utils/paginacion.js` (parseo y validación de
  `page/limit/q/sort/order` con allowlist de columnas) aplicado a alumnos, profesores,
  cursos, usuarios, personal, materias, asignaciones, notas, mensajes y correos; contrato
  uniforme `{ data, total, page, limit }`.
- **Cambio frontend:** `DataTable` consume el contrato y deja de filtrar en memoria.
- **Test:** `backend-tecApp/tests/paginacion.test.js` (unitario exhaustivo del helper) +
  `tests/listados-paginados.test.js` con supertest (límites, página fuera de rango y
  `sort` no permitido → 400).
- **Gate:** `cd backend-tecApp && npm test`.
- **Commits (2):** `feat(api): paginacion, busqueda y orden server-side con contrato uniforme`
  y `refactor(admin): consumir listados paginados del servidor`
- **Refs:** hallazgos 2.2.9 y 2.3.15

### C3 — Métricas agregadas y Overview con una sola request

- **Cambio backend:** `GET /api/admin/metricas` con totales, activos, sin curso, asistencia
  de hoy por estado, últimos registros y comunicados recientes; permiso
  `administrativo_ver_reportes`; caché en memoria de 60 s.
- **Cambio frontend:** `Overview.vue` consume un solo endpoint; gráficos en SVG inline (sin
  dependencias nuevas).
- **Test:** `backend-tecApp/tests/metricas.test.js` (forma de la respuesta, permiso y caché
  con dos llamadas) + `frontend-tecApp/tests/overview-metricas.test.js` (una sola llamada y
  render de valores).
- **Gate:** ambas suites.
- **Commits (2):** `feat(api): endpoint de metricas agregadas del panel` y
  `feat(admin): overview con metricas agregadas y graficos svg`
- **Refs:** hallazgos 2.2.8, 2.2.13

### C4 — Auditoría

- **Cambio:** tabla `auditoria` (`id`, `id_usuario`, `accion`, `entidad`, `id_entidad`,
  `datos_antes`, `datos_despues`, `ip`, `fecha`) creada por `src/db/ensureAuditoria.js` +
  helper `registrarAuditoria()` aplicado en los controllers de escritura +
  `GET /api/admin/auditoria` con filtros + vista admin con timeline y export CSV.
- **Test:** `backend-tecApp/tests/auditoria.test.js` (unitario del helper con mock del
  modelo, incluido saneo de campos sensibles) + supertest de permiso y filtros +
  `frontend-tecApp/tests/auditoria-view.test.js`.
- **Gate:** ambas suites.
- **Commits (3):** `feat(db): tabla de auditoria y helper de registro`,
  `feat(api): consulta de auditoria con filtros` y
  `feat(admin): vista de auditoria con timeline y export`
- **Refs:** hallazgo 2.2.8

### C5 — Acciones masivas y exportación completa

- **Cambio:** selección múltiple en `DataTable` + barra de acciones (baja/reactivación,
  asignar curso, exportar selección); `exportCsv` en las 12 vistas que hoy no lo tienen y
  `window.print()` con hoja de estilos de impresión.
- **Test:** `frontend-tecApp/tests/acciones-masivas.test.js` (llamadas por lote y
  confirmación) + un test de exportación por vista que verifique las columnas declaradas.
- **Gate:** `cd frontend-tecApp && npm test && npm run build`.
- **Commit:** `feat(admin): acciones masivas y exportacion en todos los listados`
- **Refs:** hallazgos 2.3.17, 2.3.21

### C6 — Accesibilidad de modales y avisos

- **Cambio:** focus trap y `aria-labelledby` en `Modal.vue`, `aria-live="polite"` en
  banners, `Escape` y restauración del foco, bloqueo de cierre con cambios sin guardar.
- **Test:** `frontend-tecApp/tests/modal-a11y.test.js` (foco inicial, Tab circular, Escape y
  `aria-labelledby`) + `tests/banners-live.test.js`.
- **Gate:** `cd frontend-tecApp && npm test`.
- **Commit:** `fix(a11y): focus trap, aria-labelledby y avisos con aria-live`
- **Refs:** hallazgo 2.3.18

---
## 8. Fase 4: estratégica

Misma disciplina: cada ítem se testea y se commitea. Se pueden ejecutar en paralelo
entre sí, respetando dependencias (E2 antes de E3; C2 antes de E1 y E12).

| Ítem | Alcance | Test | Commit |
|---|---|---|---|
| **E1 — Reportes** | Retención y previas, asistencia por curso/alumno/período, promedios, altas y bajas; export CSV/XLSX y PDF | `tests/reportes.test.js` con dataset fixture + supertest con permiso `administrativo_ver_reportes` + vista | `feat(reportes): modulo de reportes academicos con export` |
| **E2 — Configuración del sistema** | Tabla `configuracion` + `ensure` + `GET/PUT /api/admin/configuracion` + vista por secciones | Unitario de validación de claves + supertest + montaje de la vista | `feat(config): parametros institucionales y ciclo lectivo` |
| **E3 — Horarios** | Tablas + CRUD + grilla por curso/docente/aula con detección de solapamiento | Unitario del detector de conflictos con fixtures + supertest + vista | `feat(horarios): grilla horaria con deteccion de conflictos` |
| **E4 — Observaciones y sanciones** | Tablas + CRUD + visibilidad por rol | Unitario de visibilidad + supertest (403 a lo ajeno) + vista | `feat(convivencia): observaciones y sanciones de alumnos` |
| **E5 — Biblioteca en el panel** | Vistas de libros, recursos y préstamos con vencimientos | Montaje por vista + servicio con axios mockeado | `feat(admin): seccion de biblioteca en el panel` |
| **E6 — Objetos perdidos en el panel** | Listado, cambio de estado y reclamo | Montaje + flujo de estados | `feat(admin): gestion de objetos perdidos` |
| **E7 — Notificaciones y preferencias** | Tabla + centro de notificaciones + canal por tipo | Unitario de selección de canal + vista | `feat(notificaciones): centro y preferencias por usuario` |
| **E8 — Certificados y documentos** | Plantillas + generación de PDF | Test del render de plantilla con datos fixture (HTML final) | `feat(documentos): certificados y constancias en pdf` |
| **E9 — Backups** | Export programado + verificación y restore | Test del serializador/checksum (sin DB) | `feat(infra): backup y verificacion de restauracion` |
| **E10 — Caché de permisos** | TTL corto en `obtenerPermisosDeRol` + invalidación al cambiar permisos | Unitario (la segunda llamada no consulta el modelo) + supertest | `perf(auth): cache de permisos por rol con invalidacion` |
| **E11 — Reset de contraseña y estado de cuenta** | `POST /api/usuarios/:id/reset-password`, cambio forzado y campo `estado` en `usuarios` | supertest (token de un solo uso y expiración) | `feat(usuarios): reset de contrasena y ciclo de vida de cuentas` |
| **E12 — Importación guiada** | Mapeo de columnas, dry-run y reporte de errores | Unitario del validador de filas + integración sobre `alumnos/lote` | `feat(alumnos): importacion masiva guiada con dry-run` |
| **E13 — Tiempo real (SSE)** | Cola de correo/WhatsApp y aviso de edición concurrente | Unitario del emisor de eventos | `feat(infra): sse para colas y edicion concurrente` |
| **E14 — Modo oscuro y densidad** | Tokens + `prefers-color-scheme` + preferencia por usuario | Test de la clase raíz según preferencia | `feat(ui): modo oscuro automatico y densidad configurable` |
| **E15 — Code-splitting del panel** | `defineAsyncComponent` por vista del `componentesMap` | Test de `componentesMap` (carga diferida sin romper navegación) | `perf(admin): carga diferida de vistas del panel` |

---
## 9. Matriz de trazabilidad

Cada hallazgo del análisis queda cubierto por un ítem con su test y su commit.

| Hallazgo (análisis) | Ítem | Test | Commit |
|---|---|---|---|
| `cargos` sin permisos | S1 | T0.3 + `cargos-permisos.test.js` | `fix(security): exigir permisos en cargos…` |
| Hashes de contraseña expuestos | S2 | `usuarios-contrasena.test.js` | `fix(security): no exponer hashes…` |
| Login interno abierto | S3 | `usuarios-login-interno.test.js` | `fix(security): blindar login interno…` |
| Escrituras sin permiso (alumnos) | S4 | `alumnos-permisos.test.js` | `fix(security): permiso explicito…` |
| GETs de comunidad sin intención | S5 | `comunidad-lectura.test.js` | `fix(security): declarar soloAutenticado…` |
| Noticias sin autoría | S6 | `noticias-autoria.test.js` | `fix(security): validar autoria…` |
| `autor_id` desde el body | S7 | `noticias-autor.test.js` | `fix(security): tomar autor…` |
| Cargos vacíos / URL rota | Q1, Q2 | `personal-cargos.test.js`, `academico-service-cargos.test.js` | `fix(admin): cargar cargos reales…` |
| `es_sistema` inexistente | Q3 | `roles-sistema.test.js`, `roles-view.test.js` | `feat(roles): exponer flag…` |
| CSS duplicado | Q4 | `estilos-compartidos.test.js` | `refactor(admin): unificar estilos…` |
| Estado no persistente | Q5 | `table-controls-url.test.js` | `feat(admin): sincronizar … con la url` |
| Sin paginación server-side | C2 | `paginacion.test.js` | `feat(api): paginacion…` |
| Sin métricas agregadas | C3 | `metricas.test.js` | `feat(api): endpoint de metricas…` |
| Sin auditoría | C4 | `auditoria.test.js` | `feat(db): tabla de auditoria…` |
| Exportación incompleta | C5 | `acciones-masivas.test.js` | `feat(admin): acciones masivas…` |
| Modal sin focus trap | C6 | `modal-a11y.test.js` | `fix(a11y): focus trap…` |
| Sin caché de permisos | E10 | `permisos-cache.test.js` | `perf(auth): cache de permisos…` |
| Sin reportes ni configuración | E1, E2 | `reportes.test.js`, `config.test.js` | `feat(reportes)…`, `feat(config)…` |
| Sin horarios ni convivencia | E3, E4 | `horarios.test.js`, `convivencia.test.js` | `feat(horarios)…`, `feat(convivencia)…` |
| Backend sin UI (biblioteca, objetos) | E5, E6 | tests de montaje | `feat(admin): seccion de biblioteca…` |
| Sin notificaciones ni certificados | E7, E8 | `notificaciones.test.js`, `documentos.test.js` | `feat(notificaciones)…`, `feat(documentos)…` |
| Sin backups ni tiempo real | E9, E13 | `backup.test.js`, `sse.test.js` | `feat(infra): backup…`, `feat(infra): sse…` |
| Cuentas sin ciclo de vida | E11 | `reset-password.test.js` | `feat(usuarios): reset de contrasena…` |
| Importación manual | E12 | `importacion.test.js` | `feat(alumnos): importacion masiva…` |
| Sin modo oscuro, chunk único | E14, E15 | `tema.test.js`, `code-splitting.test.js` | `feat(ui): modo oscuro…`, `perf(admin): carga diferida…` |

---

## 10. Resumen de ejecución

- **Ítems totales:** 3 (Fase 0) + 7 (Fase 1) + 5 (Fase 2) + 6 (Fase 3) + 15 (Fase 4) = **36 ítems**.
- **Commits estimados:** ~45, porque varios ítems se parten en backend/frontend o por lotes
  (Q3, C1, C2, C3, C4).
- **Orden recomendado:** `Fase -1` → `Fase 0` (T0.1 → T0.2 → T0.3) → `Fase 1` (S1…S7) →
  `Fase 2` → `Fase 3` → `Fase 4`.
- **Dependencias críticas:**
  - T0.1 y T0.2 son **bloqueantes** de todo test de rutas (S1, S2, S3, S4, S5, C2, C4, E10, E11).
  - T0.3 debe escribirse antes de S1 para que el bug quede demostrado por un test en rojo.
  - C2 antes de E1 y E12 (los reportes e importaciones asumen listados paginados).
  - E2 antes de E3 (los horarios usan parámetros institucionales).
  - Q5 antes de C1 (el `DataTable` hereda la sincronización con la URL).
- **Riesgo principal:** C1 y C2 tocan 15 vistas y 10 controllers. Mitigación: migración por
  lotes, contrato de API fijo y tests de montaje por vista antes de borrar el código viejo.
- **Definición de terminado (por ítem):**
  1. El cambio está implementado y el test del ítem pasa en local.
  2. La suite completa pasa (`backend-tecApp`: `npm test`; `frontend-tecApp`: `npm test`).
  3. Si tocó frontend, `npm run build` pasa y el `dist/` no queda con cambios ajenos.
  4. El commit usa Conventional Commits con alcance, en minúscula y sin acentos.
  5. El merge a `dev` se hizo en local, después del gate (sin CI ni workflows).
- **Rollback:** cada ítem es un commit atómico, así que se revierte con
  `git revert <sha>` sin arrastrar cambios de otros ítems.

---

### Nota metodológica

Los nombres de archivos, rutas y símbolos citados en este plan fueron verificados sobre el
árbol de trabajo actual (rama `dev`, commit `7550088`). Si alguno cambia antes de ejecutar
el ítem, se ajusta el ítem, no el gate: el test sigue siendo el criterio de aceptación.

