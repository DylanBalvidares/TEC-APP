import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import CampanitaNotificaciones from "../src/components/ui/CampanitaNotificaciones.vue";
import * as notificacionesService from "../src/services/notificaciones-service.js";
import { toast } from "../src/services/toast-service.js";
import { reiniciarEventos } from "../src/composables/useEventos.js";
import { useAuthStore } from "../src/stores/auth.js";

vi.mock("../src/services/notificaciones-service.js", () => ({
  obtenerMisNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  marcarTodasLeidas: vi.fn(),
}));

vi.mock("../src/services/toast-service.js", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// EventSource mínimo para probar la parte realtime del componente.
class FuenteFalsa {
  static instancias = [];
  constructor(url) {
    this.url = url;
    this.oyentes = {};
    FuenteFalsa.instancias.push(this);
  }
  onopen() {}
  addEventListener(tipo, fn) {
    this.oyentes[tipo] = fn;
  }
  close() {}
  emitir(tipo, datos) {
    const mensaje = { data: JSON.stringify(datos) };
    if (tipo === "message") this.onmessage?.(mensaje);
    this.oyentes[tipo]?.(mensaje);
  }
}

let lista = [];
const montados = [];

beforeEach(() => {
  vi.clearAllMocks();
  lista = [
    { id_notificacion: 1, tipo: "comunicado", titulo: "Comunicado nuevo", cuerpo: "Detalle", leida: false, fecha: "2026-10-01T10:00:00.000Z" },
    { id_notificacion: 2, tipo: "nota", titulo: "Nota cargada", cuerpo: null, leida: true, fecha: "2026-09-30T10:00:00.000Z" },
  ];
  vi.stubGlobal("EventSource", FuenteFalsa);
  setActivePinia(createPinia());
  const authStore = useAuthStore();
  authStore.token = "jwt-falso";
  authStore.usuario = { id: 10 };

  notificacionesService.obtenerMisNotificaciones.mockImplementation(async () => ({
    success: true,
    data: lista,
    total: lista.length,
  }));
  notificacionesService.marcarNotificacionLeida.mockResolvedValue({ success: true, data: {} });
  notificacionesService.marcarTodasLeidas.mockResolvedValue({ success: true, data: {} });

  reiniciarEventos();
});

afterEach(() => {
  for (const wrapper of montados) wrapper.unmount();
  montados.length = 0;
  vi.unstubAllGlobals();
});

const montar = () => {
  const wrapper = mount(CampanitaNotificaciones);
  montados.push(wrapper);
  return wrapper;
};

describe("CampanitaNotificaciones", () => {
  it("carga al montar y muestra badge con las no leídas", async () => {
    const wrapper = montar();
    await flushPromises();

    expect(notificacionesService.obtenerMisNotificaciones).toHaveBeenCalledWith(false);
    const badge = wrapper.find(".campanita-badge");
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe("1");

    // El listado vive dentro del dropdown: se ve al abrir la campanita.
    await wrapper.find(".campanita-btn").trigger("click");
    await flushPromises();
    expect(wrapper.findAll(".campanita-item").length).toBe(2);
    expect(wrapper.find(".campanita-item.leida").exists()).toBe(true);
    expect(wrapper.text()).toContain("Comunicado nuevo");
    expect(wrapper.text()).toContain("comunicado");
  });

  it("el dropdown abre a pedido y recarga el listado", async () => {
    const wrapper = montar();
    await flushPromises();
    expect(wrapper.find(".campanita-panel").exists()).toBe(false);

    await wrapper.find(".campanita-btn").trigger("click");
    await flushPromises();

    expect(wrapper.find(".campanita-panel").exists()).toBe(true);
    expect(notificacionesService.obtenerMisNotificaciones.mock.calls.length).toBe(2);
  });

  it("marcar como leída refresca el badge", async () => {
    // El server persiste la marca; la recarga de la campanita la refleja.
    notificacionesService.marcarNotificacionLeida.mockImplementation(async (id) => {
      const encontrada = lista.find((n) => n.id_notificacion === id);
      if (encontrada) encontrada.leida = true;
      return { success: true, data: {} };
    });

    const wrapper = montar();
    await flushPromises();

    // Abrir y clickear la notificación sin leer.
    await wrapper.find(".campanita-btn").trigger("click");
    await wrapper.find(".campanita-item-btn").trigger("click");
    await flushPromises();

    expect(notificacionesService.marcarNotificacionLeida).toHaveBeenCalledWith(1);
    expect(wrapper.find(".campanita-badge").exists()).toBe(false);
  });

  it("marcar todas llama al endpoint y avisa por toast", async () => {
    const wrapper = montar();
    await flushPromises();

    await wrapper.find(".campanita-btn").trigger("click");
    await wrapper.find(".campanita-marcar-todas").trigger("click");
    await flushPromises();

    expect(notificacionesService.marcarTodasLeidas).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("sin notificaciones muestra el estado vacío", async () => {
    lista = [];
    const wrapper = montar();
    await flushPromises();

    expect(wrapper.find(".campanita-badge").exists()).toBe(false);
    await wrapper.find(".campanita-btn").trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("No tenés notificaciones.");
    expect(wrapper.find(".campanita-marcar-todas").exists()).toBe(false);
  });

  it("el evento SSE propio tosta y recarga; el ajeno se ignora", async () => {
    const wrapper = montar();
    await flushPromises();
    const fuente = FuenteFalsa.instancias[0];
    expect(fuente).toBeTruthy();

    // Notificación de otro usuario: ni toast ni recarga.
    fuente.emitir("notificacion", {
      tipo: "notificacion",
      datos: { id_usuario: 999, titulo: "Ajena" },
    });
    await flushPromises();
    expect(toast.info).not.toHaveBeenCalled();

    // Notificación propia: toast + recarga del listado.
    fuente.emitir("notificacion", {
      tipo: "notificacion",
      datos: { id_usuario: 10, id_notificacion: 7, titulo: "Ping" },
    });
    await flushPromises();
    expect(toast.info).toHaveBeenCalledWith("Ping");
    expect(notificacionesService.obtenerMisNotificaciones.mock.calls.length).toBeGreaterThan(1);
  });

  it("eventos que no son notificaciones no tostan", async () => {
    const wrapper = montar();
    await flushPromises();
    FuenteFalsa.instancias[0].emitir("message", {
      data: JSON.stringify({ tipo: "cola", datos: { pendientes: 2 } }),
    });
    await flushPromises();
    expect(toast.info).not.toHaveBeenCalled();
  });
});
