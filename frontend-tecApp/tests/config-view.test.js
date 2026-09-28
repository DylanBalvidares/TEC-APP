import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ConfigView from "../src/components/administrador/views/ConfigView.vue";
import * as adminService from "../src/services/admin-service.js";

vi.mock("../src/services/admin-service.js", () => ({
  obtenerConfiguracion: vi.fn(),
  guardarConfiguracion: vi.fn(),
  obtenerMetricas: vi.fn(),
  obtenerAuditoria: vi.fn(),
  obtenerResumenReportes: vi.fn(),
}));

const CONFIG = {
  institucion_nombre: "Técnica 2",
  institucion_email: "t2@edu.ar",
  ciclo_lectivo_anio: "2026",
};

describe("ConfigView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.obtenerConfiguracion.mockResolvedValue({ success: true, data: CONFIG });
    adminService.guardarConfiguracion.mockResolvedValue({ success: true, data: CONFIG });
  });

  it("hidrata el formulario desde la API", async () => {
    const wrapper = mount(ConfigView);
    await flushPromises();
    const inputs = wrapper.findAll("input");
    expect(inputs[0].element.value).toBe("Técnica 2");
  });

  it("guardar envía los cambios y confirma", async () => {
    const wrapper = mount(ConfigView);
    await flushPromises();
    await wrapper.find(".tb-btn.primary").trigger("click");
    await flushPromises();
    expect(adminService.guardarConfiguracion).toHaveBeenCalledWith(
      expect.objectContaining({ institucion_nombre: "Técnica 2" }),
    );
    expect(wrapper.text()).toContain("guardada correctamente");
  });

  it("muestra error si falla la carga", async () => {
    adminService.obtenerConfiguracion.mockResolvedValue({ success: false, message: "caído" });
    const wrapper = mount(ConfigView);
    await flushPromises();
    expect(wrapper.text()).toContain("caído");
  });
});
