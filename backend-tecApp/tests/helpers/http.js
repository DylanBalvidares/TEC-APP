/**
 * Helper de tests HTTP: monta la app de Express en un puerto efímero y expone un
 * cliente mínimo sobre `fetch` (nativo de Node). No requiere supertest ni base de
 * datos: las variables de entorno se fijan ANTES de importar la app, así
 * `conexionDB` no abre conexión (ver guard en src/db/conexionDB.js).
 */
process.env.NODE_ENV = "test";
process.env.SKIP_DB_CONNECT = "1";
delete process.env.UPLOADS_DIR;
process.env.JWT_SECRET ||= "test-jwt-secret";

let appPromise = null;
let servidorPromise = null;

function cargarApp() {
  if (!appPromise) {
    appPromise = import("../../src/app.js").then((mod) => mod.default);
  }
  return appPromise;
}

async function levantarServidor() {
  const app = await cargarApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const request = async (method, ruta, { token, body, headers = {} } = {}) => {
    const cabeceras = { ...headers };
    if (token) cabeceras.Authorization = `Bearer ${token}`;
    if (body !== undefined) cabeceras["Content-Type"] = "application/json";

    const res = await fetch(`${base}${ruta}`, {
      method,
      headers: cabeceras,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const texto = await res.text();
    let data = null;
    if (texto) {
      try {
        data = JSON.parse(texto);
      } catch {
        data = texto;
      }
    }

    return { status: res.status, data };
  };

  return {
    base,
    request,
    cerrar: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** Devuelve (y memoiza) el servidor de test del archivo actual. */
export function obtenerServidor() {
  if (!servidorPromise) servidorPromise = levantarServidor();
  return servidorPromise;
}

/** Cierra el servidor si se levantó. Pensado para `after(cerrarServidor)`. */
export async function cerrarServidor() {
  if (!servidorPromise) return;
  const servidor = await servidorPromise;
  servidorPromise = null;
  await servidor.cerrar();
}
