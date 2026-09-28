import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ConvivenciaView from "../src/components/administrador/views/ConvivenciaView.vue";
import * as academicoService from "../src/services/academico-service.js";

vi.mock("../src/services/academico-service.js", async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    obtenerSanciones: vi.fn(),
    crearSancion: vi.fn(),
    eliminarSancion: vi.fn(),
    obtenerObservaciones: vi.fn(),
    crearObservacion: vi.fn(),
  };
});

vi.mock("../src/services/toast-service.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "../src/services/toast-service.js";

const SANCIONES = [
  { id_sancion: 1, id_alumno: 2, tipo: "apercibimiento", motivo: "Tarde", fecha: "2026-09-01" },
];
const OBS = [{ id_observacion: 1, id_alumno: 2, texto: "Buena5410", fecha: "2026-09-01" }];

describe("ConvivenciaView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    academicoService.obtenerSanciones.mockResolvedValue({ success: true, data: SANCIONES });
    academicoService.obtenerObservaciones.mockResolvedValue({ success: true, data: OBS });
  });

  it("carga sanciones y observaciones en paralelo", async () => {
    const wrapper = mount(ConvivenciaView, { global: { stubs: { Modal: true } } });
    await flushPromises();
    expect(academicoService.obtenerSanciones).toHaveBeenCalledWith(null);
    expect(wrapper.text()).toContain("apercibimiento");
    expect(wrapper.text()).toContain("Buena5410");
  });

  it("filtrar por alumno recarga ambas listas", async () => {
    const wrapper = mount(ConvivenciaView, { global: { stubs: { Modal: true } } });
    await flushPromises();
    academicoService.obtenerSanciones.mockClear();
    await wrapper.find('input[aria-label="Filtrar por alumno"]').setValue("2");
    await wrapper.find(".search-bar-wrapper .tb-btn.outline").trigger("click");
    await flushPromises();
    expect(academicoService.obtenerSanciones).toHaveBeenCalledWith(2);
    expect(academicoService.obtenerObservaciones).toHaveBeenCalledWith(2);
  });

  it("eliminar una sancion confirma con el servicio", async () => {
    academicoService.eliminarSancion.mockResolvedValue({ success: true, data: {} });
    const wrapper = mount(ConvivenciaView, { global: { stubs: { Modal: true } } });
    await flushPromises();
    await wrapper.find("button.icon-btn.delete").trigger("click");
    await flushPromises();
    expect(academicoService.eliminarSancion).toHaveBeenCalledWith(1);
    expect(toast.success).toHaveBeenCalled();
  });
});
