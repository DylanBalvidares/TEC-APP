import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import Overview from "../src/components/administrador/views/Overview.vue";
import * as adminService from "../src/services/admin-service.js";

vi.mock("../src/services/admin-service.js", () => ({
  obtenerMetricas: vi.fn(),
}));

const METRICAS = {
  totales: {
    alumnos: 120,
    alumnosActivos: 110,
    alumnosSinCurso: 7,
    profesores: 15,
    cursos: 6,
    comunicados: 4,
  },
  asistenciaHoy: { total: 100, presente: 80, ausente: 15, tarde: 5, justificado: 0 },
  ultimosAlumnos: [
    { id_alumno: 9, nombre: "Ana", apellido: "Paz", dni: "1", Curso: { nombre_curso: "1A" } },
  ],
  comunicadosRecientes: [
    { id_comunicado: 4, titulo: "Aviso", destino: "todos", fecha_publicacion: "2026-09-01" },
  ],
};

describe("Overview con metricas agregadas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.obtenerMetricas.mockResolvedValue({ success: true, data: METRICAS });
  });

  it("hace una sola llamada y renderiza los valores", async () => {
    const wrapper = mount(Overview);
    await flushPromises();
    expect(adminService.obtenerMetricas).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("120");
    expect(wrapper.text()).toContain("15");
    expect(wrapper.text()).toContain("Ana Paz");
    expect(wrapper.text()).toContain("Aviso");
  });

  it("renderiza el donut svg de asistencia", async () => {
    const wrapper = mount(Overview);
    await flushPromises();
    const donut = wrapper.find("svg.donut");
    expect(donut.exists()).toBe(true);
    expect(donut.attributes("aria-label")).toContain("asistencia");
    expect(wrapper.text()).toContain("80%");
  });

  it("muestra error si la request falla", async () => {
    adminService.obtenerMetricas.mockResolvedValue({ success: false, message: "caído" });
    const wrapper = mount(Overview);
    await flushPromises();
    expect(wrapper.text()).toContain("caído");
  });
});
