import { defineStore } from "pinia";
import { ref } from "vue";
import { obtenerUsuarios } from "../services/usuarios-services.js";

// Catálogo compartido de Comunicación: la lista de usuarios (para mapas de
// autores y roles) antes se fetcheaba por separado en Mensajes,
// Comunicados y MonitorCorreos. La caché evita requests duplicados entre las
// tabs del módulo.
const normalizarLista = (res) => {
  if (!res || res.success === false) return null;
  const data = res?.data?.data ?? res?.data ?? res;
  return Array.isArray(data) ? data : [];
};

export const TABS_COMUNICACION = ["noticias", "comunicados", "mensajes", "emails"];

export const useComunicacionStore = defineStore("comunicacion", () => {
  const usuarios = ref([]);
  const cargado = ref(false);
  const error = ref("");
  const cargando = ref(false);
  const tabPendiente = ref(null);
  // Promesa en vuelo: si varias tabs montan a la vez (v-show), comparten
  // un solo request en lugar de disparar uno cada una.
  let enVuelo = null;

  async function ejecutarCarga() {
    cargando.value = true;
    error.value = "";
    try {
      const res = await obtenerUsuarios();
      const lista = normalizarLista(res);
      if (lista === null) {
        error.value = res?.message || "No se pudieron cargar los usuarios.";
        return false;
      }
      usuarios.value = lista;
      cargado.value = true;
      return true;
    } catch {
      error.value = "No se pudieron cargar los usuarios.";
      return false;
    } finally {
      cargando.value = false;
    }
  }

  async function cargar(forzar = false) {
    if (cargado.value && !forzar) return true;
    if (!forzar && enVuelo) return enVuelo;
    const promesa = ejecutarCarga();
    if (!forzar) enVuelo = promesa;
    try {
      return await promesa;
    } finally {
      if (!forzar) enVuelo = null;
    }
  }

  // Carga perezosa: solo va a la API si aún no está en caché.
  async function asegurar() {
    return cargar(false);
  }

  // Tras cambios que afecten usuarios/autores: refresca para todas las tabs.
  async function invalidar() {
    return cargar(true);
  }

  function reset() {
    usuarios.value = [];
    cargado.value = false;
    error.value = "";
    cargando.value = false;
    tabPendiente.value = null;
  }

  function solicitarTab(tab) {
    // Bus genérico de tab pendiente (lo valida el contenedor que consume).
    tabPendiente.value = tab ?? null;
  }

  function consumirTabPendiente() {
    const tab = tabPendiente.value;
    tabPendiente.value = null;
    return typeof tab === "string" && tab ? tab : null;
  }

  return {
    usuarios,
    cargado,
    error,
    cargando,
    tabPendiente,
    cargar,
    asegurar,
    invalidar,
    reset,
    solicitarTab,
    consumirTabPendiente,
  };
});
