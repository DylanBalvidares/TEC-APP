import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { toast, usarToasts } from "../src/services/toast-service.js";

describe("toast-service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // limpiar toasts pendientes
    const { toasts } = usarToasts();
    toasts.splice(0, toasts.length);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("agrega un toast de éxito con mensaje", () => {
    toast.success("Guardado correctamente");
    const { toasts } = usarToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].tipo).toBe("success");
    expect(toasts[0].mensaje).toBe("Guardado correctamente");
  });

  it("agrega toasts de error e info con duraciones mayores/menores", () => {
    toast.error("Falló la operación");
    toast.info("Sin cambios");
    const { toasts } = usarToasts();
    expect(toasts).toHaveLength(2);
    expect(toasts[0].tipo).toBe("error");
    expect(toasts[1].tipo).toBe("info");
    expect(toasts[0].duracion).toBeGreaterThan(toasts[1].duracion);
  });

  it("elimina un toast al cerrarlo manualmente", () => {
    const id = toast.success("Hola");
    const { toasts } = usarToasts();
    expect(toasts).toHaveLength(1);
    toast.cerrar(id);
    expect(toasts).toHaveLength(0);
  });

  it("auto-elimina el toast cuando expira su duración", () => {
    toast.info("Temporal", { duracion: 1000 });
    const { toasts } = usarToasts();
    expect(toasts).toHaveLength(1);
    vi.advanceTimersByTime(1100);
    expect(toasts).toHaveLength(0);
  });

  it("genera ids únicos para cada toast", () => {
    const a = toast.success("a");
    const b = toast.success("b");
    expect(a).not.toBe(b);
  });
});
