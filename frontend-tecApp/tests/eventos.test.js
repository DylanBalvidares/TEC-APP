import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { usarEventos, reiniciarEventos } from "../src/composables/useEventos.js";
import { useAuthStore } from "../src/stores/auth.js";

class FuenteFalsa {
  static instancias = [];
  constructor(url) {
    this.url = url;
    this.oyentes = {};
    this.cerrada = false;
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

const montados = [];

function montar({ oyenteRoto = false } = {}) {
  let api = null;
  const Comp = defineComponent({
    setup() {
      api = usarEventos({
        alEvento: oyenteRoto
          ? () => {
              throw new Error("oyente roto");
            }
          : (e) => api.recibidos.push(e),
      });
      api.recibidos = [];
      return () => null;
    },
    template: "<div />",
  });
  const wrapper = mount(Comp);
  montados.push(wrapper);
  return { wrapper, api };
}

beforeEach(() => {
  FuenteFalsa.instancias = [];
  vi.stubGlobal("EventSource", FuenteFalsa);
  setActivePinia(createPinia());
  useAuthStore().token = "jwt-falso";
  reiniciarEventos();
});

afterEach(() => {
  // El composable se desconecta al desmontar: refleja el ref-count real.
  for (const wrapper of montados) wrapper.unmount();
  montados.length = 0;
  vi.unstubAllGlobals();
});

describe("usarEventos", () => {
  it("conecta con el token por query", () => {
    const { api } = montar();
    api.conectar();
    expect(FuenteFalsa.instancias.length).toBe(1);
    expect(FuenteFalsa.instancias[0].url).toContain("/api/admin/eventos?token=jwt-falso");
  });

  it("varios consumidores comparten una sola conexión", () => {
    const a = montar();
    const b = montar();
    a.api.conectar();
    b.api.conectar();
    expect(FuenteFalsa.instancias.length).toBe(1);

    // El que se desconecta no cierra el stream del otro.
    a.api.desconectar();
    expect(FuenteFalsa.instancias[0].cerrada).toBe(false);
    b.api.desconectar();
    expect(FuenteFalsa.instancias[0].cerrada).toBe(true);

    // reconectar reinstala una conexión nueva
    b.api.conectar();
    expect(FuenteFalsa.instancias.length).toBe(2);
    expect(FuenteFalsa.instancias[1].cerrada).toBe(false);
  });

  it("reparte eventos nombrados y anónimos a todos los oyentes", async () => {
    const a = montar();
    const b = montar();
    a.api.conectar();
    b.api.conectar();
    const fuente = FuenteFalsa.instancias[0];

    fuente.emitir("notificacion", { tipo: "notificacion", datos: { titulo: "Hola" } });
    await flushPromises();
    expect(a.api.recibidos.length).toBe(1);
    expect(b.api.recibidos.length).toBe(1);
    expect(b.api.ultimoEvento.value.datos.titulo).toBe("Hola");

    // Las confirmaciones de lectura también llegan como eventos nombrados.
    fuente.emitir("confirmacion_lectura", {
      tipo: "confirmacion_lectura",
      datos: { id_comunicado: 42 },
    });
    await flushPromises();
    expect(a.api.recibidos.length).toBe(2);
    expect(b.api.recibidos.length).toBe(2);
    expect(b.api.ultimoEvento.value.datos.id_comunicado).toBe(42);

    // Los eventos anónimos (onmessage) también pasan por el mismo reparto.
    fuente.emitir("message", { tipo: "cola", datos: { pendientes: 3 } });
    await flushPromises();
    expect(a.api.recibidos.length).toBe(3);
    expect(b.api.recibidos.length).toBe(3);
    expect(b.api.ultimoEvento.value.tipo).toBe("cola");
  });

  it("un oyente roto no tumba la repartición", async () => {
    const sano = montar();
    const roto = montar({ oyenteRoto: true });
    sano.api.conectar();
    roto.api.conectar();
    FuenteFalsa.instancias[0].emitir("notificacion", { tipo: "notificacion", datos: { titulo: "X" } });
    await flushPromises();
    expect(sano.api.recibidos.length).toBe(1);
    expect(roto.api.recibidos.length).toBe(0);
  });

  it("desconectar cierra la fuente y marca estado", () => {
    const { api } = montar();
    api.conectar();
    const fuente = FuenteFalsa.instancias[0];
    fuente.onopen();
    expect(api.conectado.value).toBe(true);
    api.desconectar();
    expect(fuente.cerrada).toBe(true);
    expect(api.conectado.value).toBe(false);
  });

  it("no conecta sin token", () => {
    useAuthStore().token = null;
    const { api } = montar();
    api.conectar();
    expect(FuenteFalsa.instancias.length).toBe(0);
    expect(api.conectado.value).toBe(false);
  });
});
