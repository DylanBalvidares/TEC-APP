import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios");

vi.mock("../src/stores/auth.js", () => ({
  useAuthStore: () => ({ token: "fake-token" }),
}));

import {
  obtenerCargos,
  obtenerCargo,
  crearCargo,
} from "../src/services/academico-service.js";

describe("academico-service cargos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("obtiene el listado con GET /cargos", async () => {
    axios.get.mockResolvedValue({ data: [{ id_cargo: 1 }] });
    const r = await obtenerCargos();
    expect(axios.get).toHaveBeenCalledWith(
      "/api/academico/cargos",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer fake-token" }),
      }),
    );
    expect(r.success).toBe(true);
  });

  it("obtiene un cargo con GET /cargos/:id (plural)", async () => {
    axios.get.mockResolvedValue({ data: { id_cargo: 3 } });
    const r = await obtenerCargo(3);
    expect(axios.get).toHaveBeenCalledWith(
      "/api/academico/cargos/3",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer fake-token" }),
      }),
    );
    expect(r.success).toBe(true);
  });

  it("crea un cargo con POST /cargos y payload acotado", async () => {
    axios.post.mockResolvedValue({ data: { id_cargo: 9 } });
    const r = await crearCargo({ nombre_cargo: "Preceptor", descripcion: "d" });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/academico/cargos",
      { nombre_cargo: "Preceptor", descripcion: "d" },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer fake-token" }),
      }),
    );
    expect(r.success).toBe(true);
  });
});
