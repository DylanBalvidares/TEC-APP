import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ReportesView from "../src/components/administrador/views/ReportesView.vue";
import * as adminService from "../src/services/admin-service.js";

vi.mock("../src/services/admin-service.js", () => ({
  obtenerResumenReportes: vi.fn(),
  obtenerMetricas: vi.fn(),
  obtenerAuditoria: vi.fn(),
}));

vi.mock("../src/utils/exportCsv.js", () => ({
  exportarCsv: vi.fn(),
}));

vi.mock("../src/services/toast-service.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { exportarCsv } from "../src/utils/exportCsv.js";

const RESUMEN = {
  retencion: [
    { id_curso: 1, nombre: "1A", activos: 20, bajas: 2, total: 22, retencion_pct: 91 },
  ],
  asistenciaPorCurso: [],
  promediosPorMateria: [
    { id_materia: 2, nombre: "Matemática", promedio: 7.5 },
  ],
  altasBajas: { activo: 90, baja: 10 },
};

describe("ReportesView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.obtenerResumenReportes.mockResolvedValue({ success: true, data: RESUMEN });
  });

  it("pide el resumen una vez y renderiza las secciones", async () => {
    const wrapper = mount(ReportesView);
    await flushPromises();
    expect(adminService.obtenerResumenReportes).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("1A");
    expect(wrapper.text()).toContain("Matemática");
    expect(wrapper.text()).toContain("91%");
  });

  it("exporta retencion y promedios a CSV", async () => {
    const wrapper = mount(ReportesView);
    await flushPromises();
    const botones = wrapper.findAll(".exportar-btn");
    expect(botones.length).toBe(2);
    await botones[0].trigger("click");
    expect(exportarCsv).toHaveBeenCalledWith(
      RESUMEN.retencion,
      expect.objectContaining({ nombreArchivo: "reporte-retencion" }),
    );
    await botones[1].trigger("click");
    expect(exportarCsv).toHaveBeenCalledWith(
      RESUMEN.promediosPorMateria,
      expect.objectContaining({ nombreArchivo: "reporte-promedios" }),
    );
  });
});
