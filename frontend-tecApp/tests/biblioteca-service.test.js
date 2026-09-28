import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios");

vi.mock("../src/stores/auth.js", () => ({
  useAuthStore: () => ({ token: "fake-token" }),
}));

import {
  obtenerRecursos,
  obtenerPrestamos,
  registrarDevolucion,
} from "../src/services/biblioteca-service.js";

describe("biblioteca-service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("obtiene recursos y prestamos", async () => {
    axios.get.mockResolvedValue({ data: [{ id_recurso: 1 }] });
    const r = await obtenerRecursos();
    expect(axios.get).toHaveBeenCalledWith(
      "/api/biblioteca/recursos",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer fake-token" }) }),
    );
    expect(r.data).toHaveLength(1);

    axios.get.mockResolvedValue({ data: { data: [{ id_prestamo: 2 }] } });
    const p = await obtenerPrestamos();
    expect(p.data).toHaveLength(1);
  });

  it("registra la devolucion con fecha de hoy", async () => {
    axios.patch.mockResolvedValue({ data: { ok: true } });
    const hoy = new Date().toISOString().slice(0, 10);
    const r = await registrarDevolucion({ id_prestamo: 5, estado: "prestado" });
    expect(axios.patch).toHaveBeenCalledWith(
      "/api/biblioteca/prestamos/5",
      expect.objectContaining({ estado: "devuelto", fecha_devolucion: hoy }),
      expect.anything(),
    );
    expect(r.success).toBe(true);
  });

  it("mapea errores de API", async () => {
    axios.get.mockRejectedValue({ response: { status: 403, data: { error: "Denegado" } } });
    const r = await obtenerRecursos();
    expect(r.success).toBe(false);
    expect(r.message).toBe("Denegado");
  });
});
