import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("../src/services/boletines-service.js", () => ({
  obtenerPeriodosBoletin: vi.fn().mockResolvedValue({ success: true, data: [] }),
  crearPeriodoBoletin: vi.fn().mockResolvedValue({ success: true, data: { id_periodo: 1 } }),
  actualizarPeriodoBoletin: vi.fn(),
  prepararCursoBoletin: vi.fn(),
  obtenerReaperturasBoletin: vi.fn().mockResolvedValue({ success: true, data: [] }),
  decidirReaperturaBoletin: vi.fn(),
}));

vi.mock("../src/services/academico-service.js", () => ({
  obtenerCursos: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock("../src/services/toast-service.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import BoletinesAdminView from "../src/components/administrador/views/BoletinesAdminView.vue";
import { crearPeriodoBoletin } from "../src/services/boletines-service.js";
import { toast } from "../src/services/toast-service.js";

const botonCrear = (wrapper) =>
  wrapper.findAll("button.tb-btn").find((b) => b.text().includes("Crear período"));

describe("BoletinesAdminView — nuevo período", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deshabilita Crear con fechas vacías y avisa qué falta", async () => {
    const wrapper = mount(BoletinesAdminView);
    await flushPromises();
    const btn = botonCrear(wrapper);
    expect(btn.attributes("disabled")).toBeDefined();
    expect(wrapper.text()).toContain("Completá ciclo, cuatrimestre, inicio y cierre");
    // Botón deshabilitado: el navegador no dispara el clic → sin llamada a la API.
    await btn.trigger("click");
    expect(crearPeriodoBoletin).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("habilita Crear con formulario completo y resetea tras éxito", async () => {
    const wrapper = mount(BoletinesAdminView);
    await flushPromises();
    const fechas = wrapper.findAll('input[type="date"]');
    expect(fechas).toHaveLength(2);
    await fechas[0].setValue("2026-01-01");
    await fechas[1].setValue("2026-06-30");

    const btn = botonCrear(wrapper);
    expect(btn.attributes("disabled")).toBeUndefined();
    await btn.trigger("click");
    await flushPromises();

    expect(crearPeriodoBoletin).toHaveBeenCalledWith(
      expect.objectContaining({
        fecha_inicio: "2026-01-01",
        fecha_cierre: "2026-06-30",
      }),
    );
    // Reset: las fechas vuelven a vacío tras crear.
    const fechasTras = wrapper.findAll('input[type="date"]');
    expect(fechasTras[0].element.value).toBe("");
    expect(fechasTras[1].element.value).toBe("");
    wrapper.unmount();
  });

  it("bloquea inicio posterior al cierre", async () => {
    const wrapper = mount(BoletinesAdminView);
    await flushPromises();
    const fechas = wrapper.findAll('input[type="date"]');
    await fechas[0].setValue("2026-07-01");
    await fechas[1].setValue("2026-06-30");
    expect(wrapper.text()).toContain("no puede ser posterior al cierre");
    await botonCrear(wrapper).trigger("click");
    expect(crearPeriodoBoletin).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
