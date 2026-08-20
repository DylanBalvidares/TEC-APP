# Servicio Comunidad

## Descripción

Microservicio encargado de gestionar:
- **Noticias**: Cartelera de anuncios del establecimiento
- **Comunicados**: Comunicaciones institucionales con prioridad y destino
- **Objetos Perdidos**: Registro de hallazgos reportados en la escuela

## Stack Tecnológico

- **Runtime**: Node.js 20 (Alpine)
- **Framework**: Express.js
- **ORM**: Sequelize
- **BD**: MySQL 8+
- **Auth**: JWT

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## Estructura de Carpetas

```
servicio-comunidad/
├── controllers/          # Lógica de negocio
│   ├── noticias-controller.js
│   ├── comunicados-controller.js
│   └── objetos-perdidos-controller.js
├── models/              # Modelos Sequelize
│   ├── noticias-model.js
│   ├── comunicados-model.js
│   ├── objetos-perdidos-model.js
│   └── index.js
├── routes/              # Definición de rutas
│   └── comunidad-router.js
├── middlewares/         # Middlewares personalizados
│   ├── autenticar.js
│   └── comprobarPermisos.js
├── main.js              # Punto de entrada
├── ErrorHandler.js      # Manejo centralizado de errores
├── package.json
├── Dockerfile
├── .env
└── .env.example
```

## Endpoints API

### Base URL: `/api/comunidad`

### Noticias

- `GET /noticias` - Obtener todas las noticias
- `GET /noticias/:id` - Obtener una noticia específica
- `POST /noticias` - Crear una nueva noticia
- `PUT /noticias/:id` - Actualizar una noticia
- `DELETE /noticias/:id` - Eliminar una noticia

**Ejemplo POST /noticias:**
```json
{
  "titulo": "Nueva noticia",
  "contenido": "Contenido de la noticia",
  "autor_id": 1,
  "imagen_url": "https://example.com/image.jpg"
}
```

### Comunicados

- `GET /comunicados` - Obtener todos los comunicados
- `GET /comunicados/:id` - Obtener un comunicado específico
- `POST /comunicados` - Crear un nuevo comunicado
- `PUT /comunicados/:id` - Actualizar un comunicado
- `DELETE /comunicados/:id` - Eliminar un comunicado

**Ejemplo POST /comunicados:**
```json
{
  "titulo": "Comunicado importante",
  "mensaje": "Contenido del comunicado",
  "importancia": "alta",
  "destino": "todos",
  "autor_id": 1
}
```

**Valores de importancia**: `baja`, `media`, `alta`  
**Valores de destino**: `todos`, `profesores`, `alumnos`, `autoridades`

### Objetos Perdidos

- `GET /objetos-perdidos` - Obtener todos los objetos reportados
- `GET /objetos-perdidos/:id` - Obtener un objeto específico
- `POST /objetos-perdidos` - Reportar un objeto perdido
- `PUT /objetos-perdidos/:id` - Actualizar estado de un objeto
- `DELETE /objetos-perdidos/:id` - Eliminar un objeto

**Ejemplo POST /objetos-perdidos:**
```json
{
  "nombre": "Lentes de sol",
  "descripcion": "Lentes negros modelo Ray Ban",
  "encontrado_por": 1
}
```

**Ejemplo PUT /objetos-perdidos/:id:**
```json
{
  "estado": "reclamado"
}
```

**Estados disponibles**: `perdido`, `encontrado`, `reclamado`

## Manejo de Errores

Todos los errores se retornan en el siguiente formato:

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Descripción del error"
}
```

**Códigos de estado comunes:**
- `200` - OK
- `201` - Recurso creado
- `400` - Solicitud inválida
- `401` - No autorizado
- `403` - Acceso denegado
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

## Variables de Entorno

```env
COMUNIDAD_PORT=3005
DATABASE_URL=mysql://root:root_pass@localhost:3306/gestion_tecnica2
DATABASE_HOST=db
DATABASE_NAME=gestion_tecnica2
DATABASE_USER=root
DATABASE_PASSWORD=root_pass
DATABASE_PORT=3306
JWT_SECRET=clave_secreta_super_segura
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

## Docker

### Construir imagen
```bash
docker build -f ./servicio-comunidad/Dockerfile -t servicio-comunidad .
```

### Ejecutar contenedor
```bash
docker run -p 3005:3005 --env-file ./servicio-comunidad/.env servicio-comunidad
```

### Con docker-compose
```bash
docker-compose up servicio-comunidad
```

## Health Check

Endpoint de diagnóstico: `GET /health`

Respuesta:
```json
{
  "status": "UP",
  "service": "servicio-comunidad",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Notas de Desarrollo

### Arquitectura

- **Controllers**: Contienen la lógica de negocio y lanzan `ErrorHandler` en caso de error
- **Routers**: Envuelven las llamadas a controllers en try-catch
- **Models**: Definen la estructura de datos con Sequelize
- **Middlewares**: Manejo de autenticación y permisos (comentados para desarrollo)

### Mejoras Futuras

- [ ] Agregar validación de entrada con Joi o similar
- [ ] Implementar paginación en endpoints GET
- [ ] Agregar middlewares de autenticación y permisos
- [ ] Crear transacciones para operaciones complejas
- [ ] Agregar logging centralizado
- [ ] Implementar rate limiting

## Licencia

Proyecto educativo - Instituto Técnico
