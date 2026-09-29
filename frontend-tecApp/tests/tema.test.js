import { describe, it, expect, beforeEach, vi } from "vitest";
import { usarTema, reiniciarTemaParaTests, TEMAS } from "../src/composables/useTema.js";

function simularMatchMedia(oscuro) {
  window.matchMedia = vi.fn(() => ({
    matches: oscuro,
    addEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  reiniciarTemaParaTests();
  localStorage.clear();
  simularMatchMedia(false);
});

describe("usarTema", () => {
  it("por defecto sigue al sistema (claro)", () => {
    const { tema, temaEfectivo } = usarTema();
    expect(tema.value).toBe(TEMAS.SISTEMA);
    expect(temaEfectivo.value).toBe(TEMAS.CLARO);
    expect(document.documentElement.dataset.tema).toBe("claro");
  });

  it("en sistema oscuro el efectivo es oscuro", () => {
    simularMatchMedia(true);
    const { temaEfectivo } = usarTema();
    expect(temaEfectivo.value).toBe(TEMAS.OSCURO);
    expect(document.documentElement.dataset.tema).toBe("oscuro");
  });

  it("fijarTema persiste y refleja en el DOM", () => {
    const { fijarTema, temaEfectivo } = usarTema();
    fijarTema(TEMAS.OSCURO);
    expect(temaEfectivo.value).toBe(TEMAS.OSCURO);
    expect(localStorage.getItem("tecapp-tema")).toBe("oscuro");
    expect(document.documentElement.dataset.tema).toBe("oscuro");
  });

  it("alternarTema conmuta claro/oscuro de forma explícita", () => {
    const { alternarTema, tema, temaEfectivo } = usarTema();
    alternarTema();
    expect(temaEfectivo.value).toBe(TEMAS.OSCURO);
    expect(tema.value).toBe(TEMAS.OSCURO);
    alternarTema();
    expect(temaEfectivo.value).toBe(TEMAS.CLARO);
  });

  it("ignora valores inválidos y restaura sistema desde storage corrupto", () => {
    const { fijarTema, tema } = usarTema();
    fijarTema("neon");
    expect(tema.value).toBe(TEMAS.SISTEMA);
    localStorage.setItem("tecapp-tema", "neon");
    reiniciarTemaParaTests();
    // el singleton relee al instanciarse de nuevo
    const { tema: tema2 } = usarTema();
    expect(tema2.value).toBe(TEMAS.SISTEMA);
  });
});
