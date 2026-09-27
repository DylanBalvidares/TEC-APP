import { reactive } from "vue";

/**
 * Servicio global de notificaciones toast.
 * Uso:
 *   import { toast } from "@/services/toast-service.js";
 *   toast.success("Guardado correctamente");
 *   toast.error("No se pudo guardar");
 *   toast.info("Sin cambios");
 *
 * Requiere montar <Toasts /> una vez (ya está en app.vue).
 */

let contador = 0;

const state = reactive({
    toasts: [],
});

const DURACIONES = {
    success: 3200,
    error: 5200,
    info: 3000,
};

function agregar(tipo, mensaje, opciones = {}) {
    const id = ++contador;
    const duracion = opciones.duracion ?? DURACIONES[tipo] ?? 3000;
    const t = { id, tipo, mensaje, duracion };
    state.toasts.push(t);
    if (duracion > 0) {
        setTimeout(() => cerrar(id), duracion);
    }
    return id;
}

function cerrar(id) {
    const idx = state.toasts.findIndex((t) => t.id === id);
    if (idx !== -1) state.toasts.splice(idx, 1);
}

export const toast = {
    success: (msg, opts) => agregar("success", msg, opts),
    error: (msg, opts) => agregar("error", msg, opts),
    info: (msg, opts) => agregar("info", msg, opts),
    cerrar,
};

export function usarToasts() {
    return state;
}
