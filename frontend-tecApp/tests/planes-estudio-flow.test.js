import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";

const academico = vi.hoisted(() => ({
  obtenerPlanes: vi.fn(),
  obtenerPlan: vi.fn(),
  obtenerPlanesVigentes: vi.fn(),
  obtenerMaterias: vi.fn(),
  crearPlan: vi.fn(),
  modificarPlan: vi.fn(),
  eliminarPlan: vi.fn(),
  agregarMateriaAPlan: vi.fn(),
  quitarMateriaDePlan: vi.fn(),
  agregarCorrelativa: vi.fn(),
  quitarCorrelativa: vi.fn(),
}));

vi.mock("../src/services/academico-service.js", () => academico);
vi.mock("../src/services/toast-service.js", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const plan = {
  id_plan: 1,
  nombre: "Técnico en Informática",
  codigo: "TI",
  orientacion: "Informática",
  estado: "vigente",
  materiasPlan: [{
    id_plan_materia: 10,
    id_materia: 5,
    anio: 1,
    cuatrimestre: "anual",
    materia: { nombre_materia: "Matemática" },
    correlativas: [],
  }],
};

const montados = [];
const montar = async (ruta) => {
  const componente = (await import(ruta)).default;
  const wrapper = mount(componente);
  montados.push(wrapper);
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.clearAllMocks();
  academico.obtenerPlanes.mockResolvedValue({ success: true, data: [plan] });
  academico.obtenerMaterias.mockResolvedValue({ success: true, data: [] });
  academico.obtenerPlan.mockResolvedValue({ success: true, data: plan });
  academico.obtenerPlanesVigentes.mockResolvedValue({ success: true, data: [plan] });
});

afterEach(() => {
  for (const wrapper of montados) wrapper.unmount();
  montados.length = 0;
});

describe("consulta del plan vigente para profesor y preceptor", () => {
  it("expone el error de API y recupera al reintentar", async () => {
    academico.obtenerPlanesVigentes
      .mockResolvedValueOnce({ success: false, message: "No se pudo consultar el plan." })
      .mockResolvedValueOnce({ success: true, data: [plan] });
    const wrapper = await montar("../src/components/ui/PlanEstudioConsulta.vue");

    expect(wrapper.find(".pc-error").text()).toContain("No se pudo consultar el plan.");
    await wrapper.find(".pc-btn").trigger("click");
    await flushPromises();

    expect(wrapper.find(".pc-error").exists()).toBe(false);
    expect(wrapper.text()).toContain("Técnico en Informática");
    expect(wrapper.text()).toContain("Matemática");
    expect(academico.obtenerPlanesVigentes).toHaveBeenCalledTimes(2);
  });

  it("distingue una respuesta vacía de un error de consulta", async () => {
    academico.obtenerPlanesVigentes.mockResolvedValue({ success: true, data: [] });
    const wrapper = await montar("../src/components/ui/PlanEstudioConsulta.vue");

    expect(wrapper.text()).toContain("No hay planes vigentes publicados");
    expect(wrapper.find(".pc-error").exists()).toBe(false);
  });
});

describe("gestión administrativa de planes", () => {
  it("muestra el error de catálogo en vez de presentar un listado vacío", async () => {
    academico.obtenerPlanes.mockResolvedValue({ success: false, message: "Error al cargar planes." });
    const wrapper = await montar("../src/components/administrador/views/PlanesEstudioView.vue");

    expect(wrapper.find('[role="alert"]').text()).toContain("Error al cargar planes.");
    expect(wrapper.text()).not.toContain("No hay planes de estudio registrados.");
  });

  it("permite abrir los detalles y consultar las materias del plan seleccionado", async () => {
    const wrapper = await montar("../src/components/administrador/views/PlanesEstudioView.vue");

    await wrapper.find(".icon-btn.view").trigger("click");

    expect(wrapper.text()).toContain("Técnico en Informática");
    expect(wrapper.text()).toContain("Matemática");
    expect(wrapper.text()).toContain("Pasar a histórico");
  });
});
