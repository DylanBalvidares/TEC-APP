import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import PlanEstudioDetalle from "../src/components/ui/PlanEstudioDetalle.vue";

const planMock = {
  id_plan: 1,
  nombre: "Ciclo Básico",
  materiasPlan: [
    {
      id_plan_materia: 10,
      id_plan: 1,
      id_materia: 1,
      anio: 2,
      cuatrimestre: "anual",
      materia: { id_materia: 1, nombre_materia: "Matemática", carga_horaria: 4 },
      correlativas: [
        {
          id_correlativa: 100,
          id_plan_materia: 10,
          id_plan_materia_req: 11,
          requerida: {
            id_plan_materia: 11,
            anio: 1,
            materia: { nombre_materia: "Matemática I" },
          },
        },
      ],
    },
    {
      id_plan_materia: 11,
      id_plan: 1,
      id_materia: 2,
      anio: 1,
      cuatrimestre: "1",
      materia: { id_materia: 2, nombre_materia: "Matemática I", carga_horaria: 3 },
      correlativas: [],
    },
  ],
};

describe("PlanEstudioDetalle.vue", () => {
  it("agrupa materias por año ordenadas", () => {
    const wrapper = mount(PlanEstudioDetalle, { props: { plan: planMock } });
    const titulos = wrapper.findAll(".anio-titulo").map((t) => t.text());
    expect(titulos[0]).toContain("1º año");
    expect(titulos[1]).toContain("2º año");
    expect(wrapper.text()).toContain("Matemática");
  });

  it("filtra por año cuando se pasa anioFiltro", () => {
    const wrapper = mount(PlanEstudioDetalle, { props: { plan: planMock, anioFiltro: 1 } });
    expect(wrapper.findAll(".anio-titulo").length).toBe(1);
    expect(wrapper.text()).toContain("Matemática I");
    expect(wrapper.text()).not.toContain("Requiere:");
  });

  it("muestra correlativas con su requerida", () => {
    const wrapper = mount(PlanEstudioDetalle, { props: { plan: planMock } });
    expect(wrapper.text()).toContain("Requiere:");
    expect(wrapper.text()).toContain("Matemática I");
  });

  it("en modo editable emite quitar-materia y quitar-correlativa", async () => {
    const wrapper = mount(PlanEstudioDetalle, { props: { plan: planMock, editable: true } });
    // El primer botón en DOM es el del grupo 1º año (id_plan_materia 11).
    await wrapper.find(".materia-item .icon-btn.delete").trigger("click");
    expect(wrapper.emitted("quitar-materia")).toBeTruthy();
    expect(wrapper.emitted("quitar-materia")[0]).toEqual([11]);
    await wrapper.find(".corr-quitar").trigger("click");
    expect(wrapper.emitted("quitar-correlativa")).toBeTruthy();
    expect(wrapper.emitted("quitar-correlativa")[0]).toEqual([10, 11]);
  });

  it("sin editable no muestra botones de borrado", () => {
    const wrapper = mount(PlanEstudioDetalle, { props: { plan: planMock } });
    expect(wrapper.find(".materia-item .icon-btn.delete").exists()).toBe(false);
    expect(wrapper.find(".corr-quitar").exists()).toBe(false);
  });

  it("muestra estado vacío sin materias", () => {
    const wrapper = mount(PlanEstudioDetalle, { props: { plan: { materiasPlan: [] } } });
    expect(wrapper.text()).toContain("aún no tiene materias");
  });
});
