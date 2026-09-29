import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import CertificadosView from "../src/components/administrador/views/CertificadosView.vue";
import * as academicoService from "../src/services/academico-service.js";

vi.mock("../src/services/academico-service.js", async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, obtenerAlumnos: vi.fn() };
});

const ALUMNO = {
  id_alumno: 1,
  nombre: "Juan",
  apellido: "Perez",
  dni: "12345678",
  curso: { nombre_curso: "3°B" },
};

describe("CertificadosView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    academicoService.obtenerAlumnos.mockResolvedValue({ success: true, data: [ALUMNO], total: 1 });
  });

  it("busca alumnos y previsualiza la constancia", async () => {
    const wrapper = mount(CertificadosView);
    await wrapper.find('input[placeholder="Ej: Perez o 12345678"]').setValue("perez");
    await new Promise((r) => setTimeout(r, 400));
    await flushPromises();
    expect(academicoService.obtenerAlumnos).toHaveBeenCalledWith(
      expect.objectContaining({ q: "perez" }),
    );
    await wrapper.find("tbody tr").trigger("click");
    await flushPromises();
    expect(wrapper.find(".cert-hoja").text()).toContain("Perez, Juan");
    expect(wrapper.find(".cert-hoja").text()).toContain("Constancia de alumno regular");
  });

  it("imprimir invoca window.print", async () => {
    const spy = vi.spyOn(window, "print").mockImplementation(() => {});
    const wrapper = mount(CertificadosView);
    await wrapper.find('input[placeholder="Ej: Perez o 12345678"]').setValue("perez");
    await new Promise((r) => setTimeout(r, 400));
    await flushPromises();
    await wrapper.find("tbody tr").trigger("click");
    await flushPromises();
    await wrapper.find(".tb-btn.primary").trigger("click");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
