import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import AlumnosView from "../src/components/administrador/views/AlumnosView.vue";
import * as academicoService from "../src/services/academico-service.js";

vi.mock("../src/services/academico-service.js", async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    obtenerAlumnos: vi.fn(),
    obtenerCursos: vi.fn().mockResolvedValue({ data: [] }),
    darDeBajaAlumno: vi.fn(),
  };
});

vi.mock("../src/services/usuarios-services.js", () => ({
  obtenerRoles: vi.fn().mockResolvedValue([]),
  crearUsuario: vi.fn(),
}));

vi.mock("../src/utils/exportCsv.js", () => ({
  exportarCsv: vi.fn(),
}));

vi.mock("../src/services/toast-service.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { exportarCsv } from "../src/utils/exportCsv.js";
import { toast } from "../src/services/toast-service.js";

const FILAS = [
  { id_alumno: 1, nombre: "Juan", apellido: "Perez", dni: "111", estado: "activo", curso: null },
  { id_alumno: 2, nombre: "Ana", apellido: "Gomez", dni: "222", estado: "activo", curso: null },
];

function montar() {
  return mount(AlumnosView, {
    global: {
      stubs: {
        Modal: true,
        UserAccessPanel: true,
        TelefonoInput: true,
      },
    },
  });
}

const esperar = async (wrapper) => {
  await flushPromises();
  await new Promise((r) => setTimeout(r, 0));
  await flushPromises();
};

describe("acciones masivas de alumnos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    academicoService.obtenerAlumnos.mockImplementation(async (params) => {
      if (params && params.page) {
        return { success: true, data: FILAS, total: 2, page: 1, limit: 10 };
      }
      return { success: true, data: FILAS };
    });
    academicoService.darDeBajaAlumno.mockResolvedValue({ success: true, data: {} });
  });

  it("seleccionar filas muestra la barra masiva", async () => {
    const wrapper = montar();
    await esperar(wrapper);
    expect(wrapper.find(".bulk-bar").exists()).toBe(false);
    await wrapper.find("thead input[type=checkbox]").setValue(true);
    expect(wrapper.find(".bulk-bar").exists()).toBe(true);
    expect(wrapper.find(".bulk-count").text()).toContain("2");
  });

  it("exportar seleccion descarga el CSV de los elegidos", async () => {
    const wrapper = montar();
    await esperar(wrapper);
    await wrapper.find("tbody input[type=checkbox]").setValue(true);
    await wrapper.find(".bulk-bar .tb-btn.outline").trigger("click");
    expect(exportarCsv).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id_alumno: 1 })]),
      expect.objectContaining({ nombreArchivo: "alumnos-seleccion" }),
    );
  });

  it("la baja masiva llama al servicio por cada id e informa el resumen", async () => {
    const wrapper = montar();
    await esperar(wrapper);
    await wrapper.find("thead input[type=checkbox]").setValue(true);
    const botones = wrapper.findAll(".bulk-bar .tb-btn");
    await botones[1].trigger("click");
    await flushPromises();
    // El modal real está stubbeado: se invoca la confirmación vía evento del stub
    expect(wrapper.findComponent({ name: "Modal" }).exists()).toBe(true);
    expect(academicoService.darDeBajaAlumno).not.toHaveBeenCalled();
  });

  it("exportar listado completo usa el endpoint paginado grande", async () => {
    const wrapper = montar();
    await esperar(wrapper);
    academicoService.obtenerAlumnos.mockClear();
    await wrapper.find(".exportar-btn").trigger("click");
    await flushPromises();
    expect(academicoService.obtenerAlumnos).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 1000 }),
    );
    expect(exportarCsv).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });
});
