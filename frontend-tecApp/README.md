# frontend-tecApp · Gestión Escolar

Frontend del Sistema de Gestión Escolar para Técnica N°2, desarrollado con **Vue 3** + **Vite**. Se comunica con el backend de microservicios vía HTTP (axios) usando tokens JWT.

---

## Tecnologías

| Herramienta             | Rol                              |
| ----------------------- | -------------------------------- |
| Vue 3 (Composition API) | Framework principal              |
| Vite                    | Bundler y servidor de desarrollo |
| Vue Router              | Navegación entre vistas          |
| Pinia                   | Estado global (auth, usuario)    |
| Axios                   | Llamadas HTTP al backend         |

---

## Estructura del proyecto

```
src/
├── services/
│   ├── academicoService.js
│   ├── authService.js
│   └── bibliotecaService.js
│
├── stores/
│   └── authStore.js
│
├── components/
│   └── shared/
│       ├── DataTable.vue
│       ├── StatusPill.vue
│       └── FormField.vue
│
├── views/
│   ├── inicio.vue
│   ├── noticias.vue
│   │
│   ├── auth/
│   │   ├── Login.vue
│   │   ├── LoginAdministrador.vue
│   │   ├── LoginAlumno.vue
│   │   └── LoginProfesor.vue
│   │
│   ├── administrador/
│   │   ├── Dashboard-administrador.vue
│   │   └── sections/
│   │       ├── OverviewView.vue
│   │       ├── AlumnosView.vue
│   │       ├── ProfesoresView.vue
│   │       ├── CursosView.vue
│   │       ├── BibliotecaView.vue
│   │       ├── NoticiasView.vue
│   │       ├── UsuariosView.vue
│   │       └── AsignacionesView.vue
│   │
│   ├── alumno/
│   ├── profesor/
│   ├── administrativo/
│   └── tutor/
│
├── router/
│   └── index.js
│
├── assets/
│   └── global.css
│
├── App.vue
└── main.js
```

---

## Descripción de cada carpeta

### `services/`

Archivos JavaScript puros (sin Vue). Cada archivo agrupa todas las llamadas axios a un dominio del backend. **Ningún componente importa axios directamente** — siempre pasa por un service.

```
academicoService.js  →  /api/academico  (alumnos, cursos, materias, asistencias)
authService.js       →  /api/auth       (login, logout, refresh token)
bibliotecaService.js →  /api/biblioteca (libros, préstamos, devoluciones)
```

**Por qué:** si el backend cambia una URL o el formato del header, se modifica en un solo archivo y se propaga automáticamente a todas las vistas que lo usen.

---

### `stores/`

Archivos Pinia. Guardan estado global que múltiples componentes necesitan leer o modificar. El caso principal es la sesión del usuario.

```
authStore.js  →  token JWT, datos del usuario logueado, acción de logout
```

**Por qué:** sin esto, cada componente hace su propio `localStorage.getItem('token')` por separado, lo que genera duplicación y bugs difíciles de rastrear.

---

### `components/shared/`

Componentes Vue reutilizables — elementos de UI que aparecen en más de una vista. Se escriben una vez y se usan en cualquier sección.

```
DataTable.vue   →  tabla genérica con columnas configurables y acciones
StatusPill.vue  →  badge de estado (Activo / Pendiente / Inactivo)
FormField.vue   →  input o select con su label y manejo de error
```

**Por qué:** hoy el badge de estado y las tablas están copiados y pegados en cada vista. Si hay que cambiar un color o un estilo, habría que modificarlo en múltiples lugares.

---

### `views/`

Vistas completas, una por página o sección. Organizadas por **rol de usuario**.

#### `views/auth/`

Pantallas de login. Una por cada tipo de usuario (administrador, alumno, profesor) más una genérica.

#### `views/administrador/`

Dashboard del administrador/root. Contiene:

- `Dashboard-administrador.vue` — el layout general (sidebar + topbar). Solo se encarga de mostrar la sección correcta según la navegación. No tiene lógica de negocio propia.
- `sections/` — cada sección del dashboard en su propio archivo. Cada integrante del equipo de frontend puede trabajar en su sección sin tocar los archivos de los demás.

```
OverviewView.vue      →  resumen general, métricas y actividad reciente
AlumnosView.vue       →  listado, búsqueda, registro y edición de alumnos
ProfesoresView.vue    →  listado y registro de docentes
CursosView.vue        →  cursos activos y materias registradas
BibliotecaView.vue    →  catálogo, préstamos y devoluciones
NoticiasView.vue      →  publicación y listado de comunicados
UsuariosView.vue      →  usuarios del sistema y roles
AsignacionesView.vue  →  vínculo docente–materia–curso
```

#### `views/alumno/`, `views/profesor/`, `views/administrativo/`, `views/tutor/`

Vistas específicas para cada rol. Pendientes de implementación.

---

### `router/index.js`

Define todas las rutas de la aplicación y las protege según el rol del usuario logueado. Una ruta que requiere autenticación verifica el token en el store antes de dejar pasar.

---

## Flujo de una acción típica

Ejemplo: el administrador registra un nuevo alumno.

```
AlumnosView.vue
  └── llama a crearAlumno(datos)
        └── academicoService.js
              └── axios.post('/api/academico/alumnos', datos, { headers: { Authorization: Bearer token } })
                    └── Backend Node.js (puerto 9000)
```

El componente solo conoce el service. El service solo conoce la URL del backend. El token siempre se obtiene desde el store, no desde `localStorage` directamente.

---

## Instalación y uso

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

El servidor de desarrollo corre en `http://localhost:5173` por defecto. El backend debe estar corriendo en `http://localhost:9000`.

---

## Equipo

| Rol      | Integrantes                                     |
| -------- | ----------------------------------------------- |
| Backend  | Dylan Balvidares, Pia Gonzalez                  |
| Frontend | Felipe Burgeño, Victoria Galvan, Melina Carmona |

---

## Convenciones del proyecto

- Los nombres de archivos de componentes y vistas van en **PascalCase** (`AlumnosView.vue`, `StatusPill.vue`)
- Los archivos de services y stores van en **camelCase** (`academicoService.js`, `authStore.js`)
- Ningún componente importa `axios` directamente — siempre a través de un `service`
- Ningún componente lee `localStorage` directamente — siempre a través del `authStore`
- Los estilos globales van en `assets/global.css`; los estilos específicos de cada componente van en `<style scoped>`
