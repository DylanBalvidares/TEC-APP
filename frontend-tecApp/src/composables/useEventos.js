// E13: consumidor SSE. `EventSource` no envía headers, por eso el token viaja
// por query (?token=) y el backend lo promueve a Authorization.
//
// La conexión es ÚNICA por pestaña y se comparte entre consumidores (ej. la
// campanita del topbar y la página "Centro de notificaciones" del admin):
// `usarEventos` registra oyentes fan-out y ese único stream reparte a todos.
// El stream se cierra solo cuando el último consumidor se desconecta.
import { ref, onUnmounted } from "vue";
import { useAuthStore } from "../stores/auth.js";

const URL_EVENTOS = "/api/admin/eventos";

// Estado compartido del módulo (una conexión por pestaña).
const conectado = ref(false);
const ultimoEvento = ref(null);
let fuente = null;
let oyentes = new Set();
let consumidores = 0;

function crearFuente() {
  const authStore = useAuthStore();
  if (!authStore.token) return;
  fuente = new EventSource(
    `${URL_EVENTOS}?token=${encodeURIComponent(authStore.token)}`,
  );
  fuente.onopen = () => {
    conectado.value = true;
  };
  fuente.onerror = () => {
    conectado.value = false;
  };
  const repartir = (mensaje) => {
    try {
      const evento = JSON.parse(mensaje.data);
      ultimoEvento.value = evento;
      // Fan-out: un oyente roto no debe tumbar el resto.
      for (const oyente of [...oyentes]) {
        try {
          oyente(evento);
        } catch {
          // se ignora
        }
      }
    } catch {
      // fragmento no JSON (latido): se ignora
    }
  };
  fuente.onmessage = repartir;
  // Eventos con nombre (`event: notificacion`) NO pasan por onmessage:
  // se registran aparte.
  fuente.addEventListener?.("notificacion", repartir);
}

export function usarEventos({ alEvento } = {}) {
  const oyente = typeof alEvento === "function" ? alEvento : null;
  if (oyente) oyentes.add(oyente);

  function conectar() {
    if (typeof EventSource === "undefined") return;
    if (!useAuthStore().token) return;
    consumidores += 1;
    if (!fuente) crearFuente();
  }

  function desconectar() {
    consumidores = Math.max(0, consumidores - 1);
    if (consumidores === 0 && fuente) {
      fuente.close();
      fuente = null;
      conectado.value = false;
    }
  }

  onUnmounted(() => {
    if (oyente) oyentes.delete(oyente);
    desconectar();
  });

  return { conectado, ultimoEvento, conectar, desconectar };
}

// Gancho para los tests: vuelve el estado del módulo a cero.
export function reiniciarEventos() {
  fuente?.close();
  fuente = null;
  oyentes = new Set();
  consumidores = 0;
  conectado.value = false;
  ultimoEvento.value = null;
}
