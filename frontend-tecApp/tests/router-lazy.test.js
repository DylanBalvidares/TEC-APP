import { describe, it, expect } from "vitest";
import router from "../src/router/router.js";

// E15: las rutas pesadas deben ser lazy (función que devuelve el import
// dinámico); solo auth queda ansioso en el bundle inicial.
const RUTAS_LAZY = [
  "/dashboard-administrador",
  "/biblioteca",
  "/profesor",
  "/preceptor",
  "/alumno",
];

describe("router code-splitting", () => {
  it("los layouts pesados son componentes lazy", () => {
    const porPath = Object.fromEntries(
      router.getRoutes().map((r) => [r.path, r]),
    );
    for (const path of RUTAS_LAZY) {
      const ruta = porPath[path];
      expect(ruta, `existe ruta ${path}`).toBeTruthy();
      // Un componente lazy es una función sin opciones de componente ni `__vccOpts`.
      expect(typeof ruta.components.default).toBe("function");
      expect(ruta.components.default.__vccOpts).toBeUndefined();
    }
  });

  it("auth sigue ansioso", () => {
    const ruta = router.getRoutes().find((r) => r.path === "/login");
    // Import estático: objeto de componente ya resuelto, no función loader.
    expect(typeof ruta.components.default).toBe("object");
  });
});
