import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import RolesView from "../src/components/administrador/views/RolesView.vue";

vi.mock("../src/services/usuarios-services.js", () => ({
  obtenerRoles: vi.fn(),
  crearRol: vi.fn(),
  modificarRol: vi.fn(),
  eliminarRol: vi.fn(),
  obtenerTodosPermisos: vi.fn().mockResolvedValue([]),
  obtenerPermisosDeRol: vi.fn().mockResolvedValue([]),
  asignarPermisosARol: vi.fn(),
}));

import { obtenerRoles } from "../src/services/usuarios-services.js";

const ROLES = [
  { id_rol: 1, nombre_rol: "alumno", es_sistema: true },
  { id_rol: 9, nombre_rol: "externo", es_sistema: false },
];

function montar() {
  return mount(RolesView, {
    global: {
      stubs: {
        Modal: true,
      },
    },
  });
}

describe("RolesView roles de sistema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerRoles.mockResolvedValue({ data: ROLES });
  });

  it("muestra el pill sistema solo en el rol de sistema", async () => {
    const wrapper = montar();
    await flushPromises();
    const pills = wrapper.findAll(".sp-sistema");
    expect(pills).toHaveLength(1);
    expect(pills[0].text()).toBe("sistema");
  });

  it("deshabilita editar/eliminar del rol de sistema con tooltip explicativo", async () => {
    const wrapper = montar();
    await flushPromises();
    const tarjetas = wrapper.findAll(".rol-acciones");
    expect(tarjetas.length).toBeGreaterThanOrEqual(2);

    const editarSistema = tarjetas[0].find("button.icon-btn.edit");
    const eliminarSistema = tarjetas[0].find("button.icon-btn.delete");
    expect(editarSistema.attributes("disabled")).toBeDefined();
    expect(eliminarSistema.attributes("disabled")).toBeDefined();
    expect(editarSistema.attributes("title")).toBe("Rol del sistema: no se puede editar");
    expect(eliminarSistema.attributes("title")).toBe("Rol del sistema: no se puede eliminar");
  });

  it("habilita editar/eliminar del rol comun con los titulos originales", async () => {
    const wrapper = montar();
    await flushPromises();
    const tarjetas = wrapper.findAll(".rol-acciones");
    const editarComun = tarjetas[1].find("button.icon-btn.edit");
    const eliminarComun = tarjetas[1].find("button.icon-btn.delete");
    expect(editarComun.attributes("disabled")).toBeUndefined();
    expect(eliminarComun.attributes("disabled")).toBeUndefined();
    expect(editarComun.attributes("title")).toBe("Editar nombre");
    expect(eliminarComun.attributes("title")).toBe("Eliminar");
  });
});
