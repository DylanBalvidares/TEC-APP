import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import BibliotecaView from "../src/components/administrador/views/BibliotecaView.vue";
import ObjetosView from "../src/components/administrador/views/ObjetosView.vue";
import * as bibliotecaService from "../src/services/biblioteca-service.js";
import * as comunidadService from "../src/services/comunidad-service.js";

vi.mock("../src/services/biblioteca-service.js", () => ({
  obtenerRecursos: vi.fn(),
  obtenerPrestamos: vi.fn(),
  registrarDevolucion: vi.fn(),
}));

vi.mock("../src/services/comunidad-service.js", async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    obtenerObjetosPerdidos: vi.fn(),
    actualizarEstadoObjetoPerdido: vi.fn(),
  };
});

vi.mock("../src/services/toast-service.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "../src/services/toast-service.js";

describe("BibliotecaView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bibliotecaService.obtenerRecursos.mockResolvedValue({
      success: true,
      data: [{ id_recurso: 1, nombre: "Proyector", tipo: "equipo", estado: "disponible" }],
    });
    bibliotecaService.obtenerPrestamos.mockResolvedValue({
      success: true,
      data: [{ id_prestamo: 2, fecha_prestamo: "2026-01-01", fecha_devolucion: null, estado: "prestado" }],
    });
  });

  it("renderiza recursos y prestamos", async () => {
    const wrapper = mount(BibliotecaView);
    await flushPromises();
    expect(wrapper.text()).toContain("Proyector");
    expect(wrapper.text()).toContain("prestado");
  });

  it("registra la devolucion", async () => {
    bibliotecaService.registrarDevolucion.mockResolvedValue({ success: true, data: {} });
    const wrapper = mount(BibliotecaView);
    await flushPromises();
    await wrapper.find("button.icon-btn.check").trigger("click");
    await flushPromises();
    expect(bibliotecaService.registrarDevolucion).toHaveBeenCalledWith(
      expect.objectContaining({ id_prestamo: 2 }),
    );
    expect(toast.success).toHaveBeenCalled();
  });
});

describe("ObjetosView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    comunidadService.obtenerObjetosPerdidos.mockResolvedValue([
      { id_objeto: 1, nombre: "Campera", descripcion: "Azul", estado: "perdido" },
    ]);
    comunidadService.actualizarEstadoObjetoPerdido.mockResolvedValue({ success: true, data: {} });
  });

  it("renderiza objetos y avanza el estado", async () => {
    const wrapper = mount(ObjetosView);
    await flushPromises();
    expect(wrapper.text()).toContain("Campera");
    await wrapper.find(".action-buttons .tb-btn").trigger("click");
    await flushPromises();
    expect(comunidadService.actualizarEstadoObjetoPerdido).toHaveBeenCalledWith(1, "encontrado");
    expect(toast.success).toHaveBeenCalled();
  });
});
