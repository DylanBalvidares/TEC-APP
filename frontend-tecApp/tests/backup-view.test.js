import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import BackupView from "../src/components/administrador/views/BackupView.vue";
import * as adminService from "../src/services/admin-service.js";

vi.mock("../src/services/admin-service.js", async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, exportarBackup: vi.fn(), verificarBackup: vi.fn() };
});

const BACKUP = {
  version: 1,
  fecha: "2026-09-29T00:00:00.000Z",
  checksum: "abc123",
  tablas: { roles: [{ id_rol: 1 }], permisos: [] },
};

describe("BackupView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("genera el backup y muestra el resumen con checksum", async () => {
    adminService.exportarBackup.mockResolvedValue({ success: true, backup: BACKUP });
    const wrapper = mount(BackupView);
    await wrapper.find(".card-header .tb-btn").trigger("click");
    await flushPromises();
    expect(adminService.exportarBackup).toHaveBeenCalled();
    expect(wrapper.find(".backup-resumen").text()).toContain("abc123");
    expect(wrapper.find(".backup-resumen").text()).toContain("roles, permisos");
  });

  it("muestra el error si falla la generación", async () => {
    adminService.exportarBackup.mockResolvedValue({ success: false, message: "Sin permiso" });
    const wrapper = mount(BackupView);
    await wrapper.find(".card-header .tb-btn").trigger("click");
    await flushPromises();
    expect(wrapper.find(".error-banner").text()).toContain("Sin permiso");
  });

  it("verifica un backup válido desde archivo", async () => {
    adminService.verificarBackup.mockResolvedValue({
      success: true,
      ok: true,
      totalFilas: 1,
      tablas: ["roles"],
    });
    const wrapper = mount(BackupView);
    // Simula FileReader de forma sincrónica
    const RealFileReader = window.FileReader;
    window.FileReader = function () {
      return {
        readAsText: function () {
          this.result = JSON.stringify(BACKUP);
          this.onload();
        },
      };
    };
    const archivo = new File([JSON.stringify(BACKUP)], "backup.json", {
      type: "application/json",
    });
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, "files", { value: [archivo] });
    await input.trigger("change");
    await flushPromises();
    window.FileReader = RealFileReader;
    const botones = wrapper.findAll(".tb-btn.primary");
    await botones.at(-1).trigger("click");
    await flushPromises();
    expect(adminService.verificarBackup).toHaveBeenCalledWith(BACKUP);
    expect(wrapper.find(".veredicto.ok").text()).toContain("íntegro");
  });
});
