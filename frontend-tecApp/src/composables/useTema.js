// E14: modo oscuro. `tema` puede ser "claro" | "oscuro" | "sistema";
// se persiste en localStorage y se refleja en `documentElement.dataset.tema`
// para que el CSS conmute por variables.
import { ref, computed } from "vue";

export const TEMAS = Object.freeze({
  CLARO: "claro",
  OSCURO: "oscuro",
  SISTEMA: "sistema",
});

const CLAVE_STORAGE = "tecapp-tema";

function leerGuardado() {
  try {
    const valor = localStorage.getItem(CLAVE_STORAGE);
    return Object.values(TEMAS).includes(valor) ? valor : TEMAS.SISTEMA;
  } catch {
    return TEMAS.SISTEMA;
  }
}

function prefiereOscuro() {
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  } catch {
    return false;
  }
}

// Estado compartido entre todas las instancias (singleton de módulo).
const tema = ref(leerGuardado());

export function usarTema() {
  const temaEfectivo = computed(() =>
    tema.value === TEMAS.SISTEMA
      ? prefiereOscuro()
        ? TEMAS.OSCURO
        : TEMAS.CLARO
      : tema.value,
  );

  function aplicar() {
    document.documentElement.dataset.tema = temaEfectivo.value;
    try {
      localStorage.setItem(CLAVE_STORAGE, tema.value);
    } catch {
      // almacenamiento no disponible: el tema en memoria sigue valiendo
    }
  }

  function fijarTema(nuevo) {
    if (!Object.values(TEMAS).includes(nuevo)) return;
    tema.value = nuevo;
    aplicar();
  }

  function alternarTema() {
    fijarTema(temaEfectivo.value === TEMAS.OSCURO ? TEMAS.CLARO : TEMAS.OSCURO);
  }

  // Sincroniza cambios del SO cuando el modo es "sistema".
  if (typeof window !== "undefined" && window.matchMedia && !usarTema._escuchando) {
    usarTema._escuchando = true;
    try {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener?.("change", () => {
          if (tema.value === TEMAS.SISTEMA) aplicar();
        });
    } catch {
      // navegadores sin addEventListener en MediaQueryList
    }
  }

  aplicar();

  return { tema, temaEfectivo, fijarTema, alternarTema, aplicar, TEMAS };
}

export function reiniciarTemaParaTests() {
  usarTema._escuchando = false;
  tema.value = TEMAS.SISTEMA;
  try {
    localStorage.removeItem(CLAVE_STORAGE);
  } catch {
    // sin almacenamiento en el entorno de test
  }
  delete document.documentElement.dataset.tema;
}
