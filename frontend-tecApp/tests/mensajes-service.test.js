import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios");

vi.mock("../src/stores/auth.js", () => ({
  useAuthStore: () => ({ token: "fake-token" }),
}));

import {
  enviarWhatsappAAlumno,
  obtenerMisMensajes,
  obtenerTodosMensajes,
  eliminarMensaje,
} from "../src/services/mensajes-service.js";

describe("mensajes-service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envía POST a /enviar-alumno/:id con cuerpo", async () => {
    axios.post.mockResolvedValue({ data: { ok: true, mensaje: "ok" } });
    const r = await enviarWhatsappAAlumno(5, "Hola tutor");
    expect(axios.post).toHaveBeenCalledWith(
      "/api/comunidad/mensajes/enviar-alumno/5",
      { cuerpo: "Hola tutor" },
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer fake-token" }) }),
    );
    expect(r.success).toBe(true);
  });

  it("obtiene mi historial con params", async () => {
    axios.get.mockResolvedValue({ data: { ok: true, lista: [{ id_mensaje: 1 }], total: 1 } });
    const r = await obtenerMisMensajes({ limit: 10 });
    expect(axios.get).toHaveBeenCalledWith(
      "/api/comunidad/mensajes/mios",
      expect.objectContaining({ params: { limit: 10 } }),
    );
    expect(r.data).toHaveLength(1);
    expect(r.total).toBe(1);
  });

  it("obtiene historial global (admin)", async () => {
    axios.get.mockResolvedValue({ data: { ok: true, lista: [], total: 0 } });
    const r = await obtenerTodosMensajes({ estado: "enviado" });
    expect(axios.get).toHaveBeenCalledWith(
      "/api/comunidad/mensajes/todos",
      expect.objectContaining({ params: { estado: "enviado" } }),
    );
    expect(r.success).toBe(true);
  });

  it("mapea error API a {success:false, message}", async () => {
    axios.post.mockRejectedValue({ response: { status: 403, data: { error: "Acceso denegado" } } });
    const r = await enviarWhatsappAAlumno(9, "Hola");
    expect(r.success).toBe(false);
    expect(r.message).toMatch(/Acceso denegado/);
  });

  it("elimina con DELETE /:id", async () => {
    axios.delete.mockResolvedValue({ data: { ok: true } });
    const r = await eliminarMensaje(3);
    expect(axios.delete).toHaveBeenCalledWith(
      "/api/comunidad/mensajes/3",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(r.success).toBe(true);
  });
});
