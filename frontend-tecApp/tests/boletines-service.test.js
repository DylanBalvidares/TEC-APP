import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios");

vi.mock("../src/stores/auth.js", () => ({
  useAuthStore: () => ({ token: "fake-token" }),
}));

import {
  obtenerPeriodosBoletin,
  crearPeriodoBoletin,
  guardarCalificacionBoletin,
  finalizarMateriaBoletin,
  obtenerConsolidadoBoletin,
  solicitarReaperturaBoletin,
  decidirReaperturaBoletin,
  etiquetaCalificacion,
} from "../src/services/boletines-service.js";

describe("boletines-service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("obtiene períodos y crea uno nuevo", async () => {
    axios.get.mockResolvedValue({ data: [{ id_periodo: 1 }] });
    const r = await obtenerPeriodosBoletin();
    expect(axios.get).toHaveBeenCalledWith(
      "/api/academico/boletines/periodos",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer fake-token" }) }),
    );
    expect(r.success).toBe(true);

    axios.post.mockResolvedValue({ data: { id_periodo: 2 } });
    const c = await crearPeriodoBoletin({ ciclo_lectivo: 2026, cuatrimestre: "1" });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/academico/boletines/periodos",
      expect.objectContaining({ ciclo_lectivo: 2026 }),
      expect.anything(),
    );
    expect(c.success).toBe(true);
  });

  it("guarda calificación y finaliza materia", async () => {
    axios.post.mockResolvedValue({ data: { id_boletin_nota: 1 } });
    const g = await guardarCalificacionBoletin({ id_periodo: 1, tipo: "numerica", valor: 0 });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/academico/boletines/calificaciones",
      expect.objectContaining({ valor: 0 }),
      expect.anything(),
    );
    expect(g.success).toBe(true);

    axios.post.mockResolvedValue({ data: { estado: "finalizada" } });
    const f = await finalizarMateriaBoletin(1, 2);
    expect(axios.post).toHaveBeenCalledWith(
      "/api/academico/boletines/finalizar",
      { id_periodo: 1, id_asignacion: 2 },
      expect.anything(),
    );
    expect(f.success).toBe(true);
  });

  it("consolidado propaga el 409 con pendientes", async () => {
    axios.get.mockRejectedValue({ response: { status: 409, data: { message: "faltan 2" } } });
    const r = await obtenerConsolidadoBoletin(1, 1);
    expect(r.success).toBe(false);
    expect(r.status).toBe(409);
    expect(r.message).toBe("faltan 2");
  });

  it("solicita y decide reaperturas", async () => {
    axios.post.mockResolvedValue({ data: { estado: "pendiente" } });
    const s = await solicitarReaperturaBoletin(1, 2, "error de carga");
    expect(axios.post).toHaveBeenCalledWith(
      "/api/academico/boletines/reaperturas",
      expect.objectContaining({ motivo: "error de carga" }),
      expect.anything(),
    );
    expect(s.success).toBe(true);

    axios.patch.mockResolvedValue({ data: { estado: "aprobada" } });
    const d = await decidirReaperturaBoletin(9, "aprobada", "");
    expect(axios.patch).toHaveBeenCalledWith(
      "/api/academico/boletines/reaperturas/9",
      expect.objectContaining({ estado: "aprobada" }),
      expect.anything(),
    );
    expect(d.success).toBe(true);
  });

  it("etiqueta calificaciones sin convertir el 0 en pendiente", () => {
    expect(etiquetaCalificacion("numerica", 0)).toBe("0");
    expect(etiquetaCalificacion("numerica", 8.5)).toBe("8.5");
    expect(etiquetaCalificacion("TED")).toBe("TED");
    expect(etiquetaCalificacion("sin_calificar")).toBe("S/C");
    expect(etiquetaCalificacion(null)).toBe("Pendiente");
  });
});
