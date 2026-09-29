// E13: consumidor SSE. `EventSource` no envía headers, por eso el token viaja
// por query (?token=) y el backend lo promueve a Authorization.
import { ref, onUnmounted } from "vue";
import { useAuthStore } from "../stores/auth.js";

const URL_EVENTOS = "/api/admin/eventos";

export function usarEventos({ alEvento } = {}) {
  const conectado = ref(false);
  const ultimoEvento = ref(null);
  let fuente = null;

  function conectar() {
    if (fuente || typeof EventSource === "undefined") return;
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
    fuente.onmessage = (mensaje) => {
      try {
        const evento = JSON.parse(mensaje.data);
        ultimoEvento.value = evento;
        alEvento?.(evento);
      } catch {
        // fragmento no JSON (latido): se ignora
      }
    };
    // Eventos con nombre (`event: notificacion`) llegan como `data:` igual;
    // se reenvían también por tipo para suscriptores específicos.
    fuente.addEventListener?.("notificacion", (mensaje) => {
      try {
        const evento = JSON.parse(mensaje.data);
        ultimoEvento.value = evento;
        alEvento?.(evento);
      } catch {
        // se ignora
      }
    });
  }

  function desconectar() {
    fuente?.close();
    fuente = null;
    conectado.value = false;
  }

  onUnmounted(desconectar);

  return { conectado, ultimoEvento, conectar, desconectar };
}
