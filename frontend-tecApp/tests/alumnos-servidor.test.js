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
  };
});

vi.mock("../src/services/usuarios-services.js", () => ({
  obtenerRoles: vi.fn().mockResolvedValue([]),
  crearUsuario: vi.fn(),
}));

const FILA = {
  id_alumno: 1,
  nombre: "Juan",
  apellido: "Perez",
  dni: "12345678",
  estado: "activo",
  curso: { nombre_curso: "1A" },
};

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

const esperarCarga = async (wrapper) => {
  await flushPromises();
  await new Promise((r) => setTimeout(r, 0));
  await flushPromises();
};

describe("AlumnosView modo servidor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    academicoService.obtenerAlumnos.mockImplementation(async (params) => {
      if (params && params.page) {
        return { success: true, data: [FILA], total: 1, page: 1, limit: 10 };
      }
      return { success: true, data: [FILA] };
    });
  });

  it("pide la pagina al backend y renderiza las filas", async () => {
    const wrapper = montar();
    await esperarCarga(wrapper);
    const llamadas = academicoService.obtenerAlumnos.mock.calls;
    expect(llamadas.some((args) => args[0]?.page === 1)).toBe(true);
    expect(wrapper.text()).toContain("Perez");
  });

  it("la busqueda recarga pasando q al servicio", async () => {
    const wrapper = montar();
    await esperarCarga(wrapper);
    academicoService.obtenerAlumnos.mockClear();
    wrapper.find(".search-box input").setValue("perez");
    await new Promise((r) => setTimeout(r, 400));
    await flushPromises();
    const llamadas = academicoService.obtenerAlumnos.mock.calls;
    expect(llamadas.some((args) => args[0]?.q === "perez")).toBe(true);
  });
});
