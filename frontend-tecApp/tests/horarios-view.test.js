import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import HorariosView from "../src/components/administrador/views/HorariosView.vue";
import * as academicoService from "../src/services/academico-service.js";

vi.mock("../src/services/academico-service.js", async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    obtenerHorarios: vi.fn(),
    obtenerCursos: vi.fn(),
    obtenerAsignaciones: vi.fn(),
    crearHorario: vi.fn(),
    eliminarHorario: vi.fn(),
  };
});

vi.mock("../src/services/toast-service.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "../src/services/toast-service.js";

const BLOQUES = [
  {
    id_horario: 1,
    dia: 1,
    hora_inicio: "08:00",
    hora_fin: "09:00",
    aula: "A1",
    Asignacion: {
      cursoAsignacion: { nombre_curso: "1A" },
      materiaAsignacion: { nombre_materia: "Matemática" },
      profesorAsignacion: { nombre: "Juan", apellido: "Perez" },
    },
  },
];

describe("HorariosView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    academicoService.obtenerHorarios.mockResolvedValue({ success: true, data: BLOQUES });
    academicoService.obtenerCursos.mockResolvedValue({ success: true, data: [] });
    academicoService.obtenerAsignaciones.mockResolvedValue({ success: true, data: [] });
  });

  it("carga la grilla con una request y muestra los bloques", async () => {
    const wrapper = mount(HorariosView, { global: { stubs: { Modal: true } } });
    await flushPromises();
    expect(academicoService.obtenerHorarios).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("Lunes");
    expect(wrapper.text()).toContain("Matemática");
    expect(wrapper.text()).toContain("Perez");
  });

  it("filtrar por curso recarga con el id", async () => {
    academicoService.obtenerCursos.mockResolvedValue({
      success: true,
      data: [{ id_curso: 3, nombre_curso: "3B" }],
    });
    const wrapper = mount(HorariosView, { global: { stubs: { Modal: true } } });
    await flushPromises();
    academicoService.obtenerHorarios.mockClear();
    await wrapper.find(".filtro-inline select").setValue("3");
    await flushPromises();
    expect(academicoService.obtenerHorarios).toHaveBeenCalledWith(3);
  });

  it("eliminar un bloque confirma con el servicio", async () => {
    academicoService.eliminarHorario.mockResolvedValue({ success: true, data: {} });
    const wrapper = mount(HorariosView, { global: { stubs: { Modal: true } } });
    await flushPromises();
    await wrapper.find("button.icon-btn.delete").trigger("click");
    await flushPromises();
    expect(academicoService.eliminarHorario).toHaveBeenCalledWith(1);
    expect(toast.success).toHaveBeenCalled();
  });
});
