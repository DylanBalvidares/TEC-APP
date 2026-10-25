import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

const api = vi.hoisted(() => ({
  obtenerAsignacionesProfesor: vi.fn(),
  obtenerAlumnosCurso: vi.fn(),
  guardarAsistenciasLote: vi.fn(),
  obtenerHistorialAsistencias: vi.fn(),
  obtenerCursosPreceptor: vi.fn(),
  obtenerAsistencias: vi.fn(),
  obtenerHistorialAsistenciasCurso: vi.fn(),
  registrarAsistenciasLote: vi.fn(),
  crearAsistencia: vi.fn(),
  modificarAsistencia: vi.fn(),
  eliminarAsistencia: vi.fn(),
}));

vi.mock("../src/services/academico-service.js", () => api);
vi.mock("../src/composables/useProfesor.js", () => ({
  resolverIdProfesor: vi.fn().mockResolvedValue(5),
}));

describe("Toma de asistencia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    api.obtenerAsignacionesProfesor.mockResolvedValue({
      success: true,
      data: [{ id_curso: 10, cursoAsignacion: { id_curso: 10, nombre_curso: "1ro A" } }],
    });
    api.obtenerCursosPreceptor.mockResolvedValue({
      success: true,
      data: [{ id_curso: 10, nombre_curso: "1ro A", anio: 1, division: "A" }],
    });
    api.obtenerAlumnosCurso.mockResolvedValue({
      success: true,
      data: [
        { id_alumno: 21, apellido: "Pérez", nombre: "Ana" },
        { id_alumno: 22, apellido: "Díaz", nombre: "Leo" },
      ],
    });
    api.guardarAsistenciasLote.mockResolvedValue({ success: true, data: [] });
    api.registrarAsistenciasLote.mockResolvedValue({ success: true, data: [] });
    api.obtenerAsistencias.mockResolvedValue({ success: true, data: [] });
    api.obtenerHistorialAsistencias.mockResolvedValue({ success: true, data: [] });
    api.obtenerHistorialAsistenciasCurso.mockResolvedValue({ success: true, data: [] });
  });

  it("docente carga alumnos, cambia un estado y envía el lote de la fecha elegida", async () => {
    const { useAuthStore } = await import("../src/stores/auth.js");
    useAuthStore().usuario = { id: 91, id_usuario: 91 };
    const { default: AsistenciasView } = await import(
      "../src/components/profesores/views/AsistenciasView.vue"
    );
    const wrapper = mount(AsistenciasView);
    await flushPromises();

    expect(wrapper.findAll(".filter-group select option")).toHaveLength(2);
    await wrapper.find(".filter-group select").setValue("10");
    await wrapper.find(".btn-add-subject").trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Pérez, Ana");

    await wrapper.findAll(".btn-ausente")[0].trigger("click");
    expect(wrapper.findAll(".btn-ausente")[0].attributes("aria-pressed")).toBe("true");
    await wrapper.find(".btn-guardar-asist").trigger("click");
    await flushPromises();

    expect(api.guardarAsistenciasLote).toHaveBeenCalledWith(expect.objectContaining({
      id_curso: 10,
      fecha: expect.any(String),
      registrado_por: 91,
      registros: [
        { id_alumno: 21, estado: "ausente" },
        { id_alumno: 22, estado: "presente" },
      ],
    }));
    expect(wrapper.text()).toContain("Asistencias guardadas correctamente.");
    wrapper.unmount();
  });

  it("preceptor aplica el estado masivo y guarda registros con su identidad", async () => {
    const { useAuthStore } = await import("../src/stores/auth.js");
    useAuthStore().usuario = { id_usuario: 92 };
    const { default: AsistenciasView } = await import(
      "../src/components/preceptor/views/AsistenciasView.vue"
    );
    const wrapper = mount(AsistenciasView);
    await flushPromises();

    await wrapper.find(".as-btn-green").trigger("click");
    expect(wrapper.findAll(".as-batch-row")).toHaveLength(2);
    await wrapper.findAll(".as-modal-tools .as-btn-outline")[1].trigger("click");
    expect(wrapper.findAll(".as-batch-row select").map((select) => select.element.value))
      .toEqual(["ausente", "ausente"]);

    await wrapper.find(".as-modal-foot .as-btn-green").trigger("click");
    await flushPromises();
    expect(api.registrarAsistenciasLote).toHaveBeenCalledWith(expect.objectContaining({
      registrado_por: 92,
      id_curso: 10,
      registros: [
        { id_alumno: 21, estado: "ausente" },
        { id_alumno: 22, estado: "ausente" },
      ],
    }));
    expect(wrapper.text()).toContain("Asistencias registradas correctamente.");
    wrapper.unmount();
  });
});
