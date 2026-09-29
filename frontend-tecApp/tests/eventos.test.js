import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { usarEventos } from "../src/composables/useEventos.js";
import { useAuthStore } from "../src/stores/auth.js";

class FuenteFalsa {
  static instancias = [];
  constructor(url) {
    this.url = url;
    this.oyentes = {};
    FuenteFalsa.instancias.push(this);
  }
  addEventListener(tipo, fn) {
    this.oyentes[tipo] = fn;
  }
  close() {
    this.cerrada = true;
  }
  emitir(tipo, datos) {
    const mensaje = { data: JSON.stringify(datos) };
    if (tipo === "message") this.onmessage?.(mensaje);
    this.oyentes[tipo]?.(mensaje);
  }
}

function montar() {
  let api = null;
  const Comp = defineComponent({
    setup() {
      api = usarEventos({
        alEvento: (e) => {
          api.recibidos.push(e);
        },
      });
      api.recibidos = [];
      return () => null;
    },
    template: "<div />",
  });
  const wrapper = mount(Comp);
  return { wrapper, api };
}

beforeEach(() => {
  FuenteFalsa.instancias = [];
  vi.stubGlobal("EventSource", FuenteFalsa);
  setActivePinia(createPinia());
  useAuthStore().token = "jwt-falso";
});

describe("usarEventos", () => {
  it("conecta con el token por query", () => {
    const { api } = montar();
    api.conectar();
    expect(FuenteFalsa.instancias.length).toBe(1);
    expect(FuenteFalsa.instancias[0].url).toContain("/api/admin/eventos?token=jwt-falso");
  });

  it("reparte eventos nombrados al callback", async () => {
    const { api } = montar();
    api.conectar();
    const fuente = FuenteFalsa.instancias[0];
    fuente.emitir("notificacion", { tipo: "notificacion", datos: { titulo: "Hola" } });
    await flushPromises();
    expect(api.recibidos.length).toBe(1);
    expect(api.ultimoEvento.value.datos.titulo).toBe("Hola");
  });

  it("desconectar cierra la fuente y marca estado", () => {
    const { api, wrapper } = montar();
    api.conectar();
    const fuente = FuenteFalsa.instancias[0];
    fuente.onopen();
    expect(api.conectado.value).toBe(true);
    api.desconectar();
    expect(fuente.cerrada).toBe(true);
    expect(api.conectado.value).toBe(false);
    wrapper.unmount();
  });

  it("no conecta sin token", () => {
    useAuthStore().token = null;
    const { api } = montar();
    api.conectar();
    expect(FuenteFalsa.instancias.length).toBe(0);
  });
});
