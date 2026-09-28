import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import AuditoriaView from "../src/components/administrador/views/AuditoriaView.vue";
import * as adminService from "../src/services/admin-service.js";

vi.mock("../src/services/admin-service.js", () => ({
  obtenerAuditoria: vi.fn(),
  obtenerMetricas: vi.fn(),
}));

vi.mock("../src/utils/exportCsv.js", () => ({
  exportarCsv: vi.fn(),
}));

vi.mock("../src/services/toast-service.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { exportarCsv } from "../src/utils/exportCsv.js";

const REGISTROS = [
  {
    id_auditoria: 1,
    accion: "crear",
    entidad: "usuario",
    id_entidad: 3,
    id_usuario: 8,
    ip: "127.0.0.1",
    fecha: "2026-09-01T10:00:00.000Z",
  },
  {
    id_auditoria: 2,
    accion: "eliminar",
    entidad: "alumno",
    id_entidad: 5,
    id_usuario: 8,
    ip: null,
    fecha: "2026-09-02T10:00:00.000Z",
  },
];

describe("AuditoriaView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.obtenerAuditoria.mockResolvedValue({ success: true, data: REGISTROS, total: 2 });
  });

  it("carga el timeline con una sola request paginada", async () => {
    const wrapper = mount(AuditoriaView, { global: { stubs: { Pagination: true } } });
    await flushPromises();
    expect(adminService.obtenerAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
    expect(wrapper.findAll(".timeline-item")).toHaveLength(2);
    expect(wrapper.text()).toContain("usuario");
  });

  it("filtrar por entidad recarga con el filtro", async () => {
    const wrapper = mount(AuditoriaView, { global: { stubs: { Pagination: true } } });
    await flushPromises();
    adminService.obtenerAuditoria.mockClear();
    const selects = wrapper.findAll(".filtro-inline select");
    await selects[0].setValue("alumno");
    await flushPromises();
    expect(adminService.obtenerAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({ entidad: "alumno", page: 1 }),
    );
  });

  it("exportar descarga el CSV del listado filtrado", async () => {
    const wrapper = mount(AuditoriaView, { global: { stubs: { Pagination: true } } });
    await flushPromises();
    await wrapper.find(".exportar-btn").trigger("click");
    await flushPromises();
    expect(exportarCsv).toHaveBeenCalledWith(
      REGISTROS,
      expect.objectContaining({ nombreArchivo: "auditoria" }),
    );
  });
});
