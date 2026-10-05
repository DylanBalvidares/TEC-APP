import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useComunicacionStore } from "../src/stores/comunicacion.js";

const obtenerUsuarios = vi.fn();

vi.mock("../src/services/usuarios-services.js", () => ({
  obtenerUsuarios: (...args) => obtenerUsuarios(...args),
}));

const USUARIOS = [
  { id_usuario: 1, nombre: "Ana", apellido: "Gómez", nombre_rol: "root" },
  { id_usuario: 2, nombre: "Juan", apellido: "Pérez", rol: { nombre_rol: "profesor" } },
];

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  obtenerUsuarios.mockResolvedValue({ success: true, data: USUARIOS });
});

describe("comunicacion store", () => {
  it("asegurar trae usuarios una sola vez (caché)", async () => {
    const store = useComunicacionStore();
    expect(await store.asegurar()).toBe(true);
    expect(store.usuarios).toEqual(USUARIOS);
    expect(await store.asegurar()).toBe(true);
    expect(obtenerUsuarios).toHaveBeenCalledTimes(1);
  });

  it("soporta respuesta paginada { data: [...] }", async () => {
    const store = useComunicacionStore();
    obtenerUsuarios.mockResolvedValue({ success: true, data: { data: USUARIOS } });
    expect(await store.asegurar()).toBe(true);
    expect(store.usuarios).toEqual(USUARIOS);
  });

  it("llamadas paralelas comparten un solo request", async () => {
    const store = useComunicacionStore();
    let resolver;
    const pendiente = new Promise((res) => { resolver = res; });
    obtenerUsuarios.mockReturnValueOnce(pendiente);
    const [a, b] = await Promise.all([
      (async () => { const p = store.asegurar(); resolver({ success: true, data: USUARIOS }); return p; })(),
      store.asegurar(),
    ]);
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(store.usuarios).toEqual(USUARIOS);
    expect(obtenerUsuarios).toHaveBeenCalledTimes(1);
  });

  it("invalidar fuerza refetch", async () => {
    const store = useComunicacionStore();
    await store.asegurar();
    obtenerUsuarios.mockResolvedValue({ success: true, data: [] });
    expect(await store.invalidar()).toBe(true);
    expect(store.usuarios).toEqual([]);
    expect(obtenerUsuarios).toHaveBeenCalledTimes(2);
  });

  it("propaga el error y marca error", async () => {
    const store = useComunicacionStore();
    obtenerUsuarios.mockResolvedValue({ success: false, message: "caído" });
    expect(await store.asegurar()).toBe(false);
    expect(store.error).toContain("caído");
    expect(store.usuarios).toEqual([]);
  });

  it("solicitar/consumir tab pendiente (lo valida el contenedor)", () => {
    const store = useComunicacionStore();
    store.solicitarTab("mensajes");
    expect(store.consumirTabPendiente()).toBe("mensajes");
    expect(store.consumirTabPendiente()).toBeNull();
  });
});
