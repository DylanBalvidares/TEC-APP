import { describe, it, expect } from "vitest";
import { renderizarPlantilla, PLANTILLAS, fechaHoy } from "../src/utils/certificados.js";

const ALUMNO = { nombre: "Juan", apellido: "Perez", dni: "12345678", curso: "3°B" };

describe("certificados", () => {
  it("expone las plantillas disponibles", () => {
    expect(PLANTILLAS.map((p) => p.id)).toEqual(["alumno-regular", "asistencia"]);
  });

  it("renderiza constancia de alumno regular con el HTML final", () => {
    const html = renderizarPlantilla("alumno-regular", { alumno: ALUMNO });
    expect(html).toContain("Constancia de alumno regular");
    expect(html).toContain("Perez, Juan");
    expect(html).toContain("12345678");
    expect(html).toContain("3°B");
    expect(html).toContain(fechaHoy());
  });

  it("renderiza constancia de asistencia con porcentaje", () => {
    const html = renderizarPlantilla("asistencia", {
      alumno: ALUMNO,
      extra: { asistencia_pct: 87 },
    });
    expect(html).toContain("87%");
    expect(html).toContain("Perez, Juan");
  });

  it("escapa HTML del nombre", () => {
    const html = renderizarPlantilla("alumno-regular", {
      alumno: { ...ALUMNO, apellido: "<script>alert(1)</script>" },
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("falla con faltantes y plantilla desconocida", () => {
    expect(() => renderizarPlantilla("alumno-regular", { alumno: {} })).toThrow(/nombre/);
    expect(() => renderizarPlantilla("alumno-regular", { alumno: { nombre: "A", apellido: "B" } })).toThrow(/DNI/);
    expect(() => renderizarPlantilla("asistencia", { alumno: ALUMNO })).toThrow(/porcentaje/);
    expect(() => renderizarPlantilla("otra", { alumno: ALUMNO })).toThrow(/desconocida/);
  });
});
