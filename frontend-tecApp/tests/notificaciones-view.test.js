import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import NotificacionesView from "../src/components/administrador/views/NotificacionesView.vue";
import * as notificacionesService from "../src/services/notificaciones-service.js";

vi.mock("../src/services/notificaciones-service.js", () => ({
  obtenerMisNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  obtenerPreferencias: vi.fn(),
  guardarPreferencias: vi.fn(),
}));

vi.mock("../src/services/toast-service.js", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "../src/services/toast-service.js";

const NOTIS = [
  { id_notificacion: 1, tipo: "sancion", titulo: "Apercibido", cuerpo: "Detalle", leida: false, fecha: "2026-09-01T10:00:00.000Z" },
];

describe("NotificacionesView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    // Sin EventSource real en jsdom: el composable no debe romper el montaje.
    vi.stubGlobal("EventSource", undefined);
    notificacionesService.obtenerMisNotificaciones.mockResolvedValue({ success: true, data: NOTIS, total: 1 });
    notificacionesService.obtenerPreferencias.mockResolvedValue({ success: true, data: {} });
    notificacionesService.marcarNotificacionLeida.mockResolvedValue({ success: true, data: {} });
    notificacionesService.guardarPreferencias.mockResolvedValue({ success: true, data: {} });
  });

  it("carga centro y preferencias en paralelo", async () => {
    const wrapper = mount(NotificacionesView);
    await flushPromises();
    expect(notificacionesService.obtenerMisNotificaciones).toHaveBeenCalledWith(false);
    expect(wrapper.text()).toContain("Apercibido");
  });

  it("marcar leida recarga", async () => {
    const wrapper = mount(NotificacionesView);
    await flushPromises();
    await wrapper.find(".list-item .tb-btn").trigger("click");
    await flushPromises();
    expect(notificacionesService.marcarNotificacionLeida).toHaveBeenCalledWith(1);
  });

  it("guardar preferencias envia el mapa", async () => {
    const wrapper = mount(NotificacionesView);
    await flushPromises();
    await wrapper.findAll(".card")[1].find(".tb-btn.primary").trigger("click");
    await flushPromises();
    expect(notificacionesService.guardarPreferencias).toHaveBeenCalledWith({});
    expect(toast.success).toHaveBeenCalled();
  });
});
