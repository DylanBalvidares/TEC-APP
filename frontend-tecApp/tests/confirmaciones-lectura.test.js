import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ConfirmacionesLectura from "../src/components/ui/ConfirmacionesLectura.vue";
import * as comunidadService from "../src/services/comunidad-service.js";

vi.mock("../src/services/comunidad-service.js", () => ({
  obtenerConfirmacionesLectura: vi.fn(),
}));

const RESPUESTA = {
  id_comunicado: 7,
  titulo: "TP para junio",
  destino: "curso",
  curso_destino: "5° Año Informática (Demo)",
  total: 2,
  leidos: 1,
  pendientes: 1,
  sinCuenta: 3,
  destinatarios: [
    {
      id_usuario: 31,
      nombre: "Tadeo",
      apellido: "Martínez",
      id_rol: 1,
      leida: true,
      leida_en: "2026-10-19 10:00:00",
    },
    {
      id_usuario: 40,
      nombre: "Lucía",
      apellido: "Gómez",
      id_rol: 6,
      leida: false,
      leida_en: null,
    },
  ],
};

const montar = async () => {
  const wrapper = mount(ConfirmacionesLectura, {
    props: { idComunicado: 7 },
  });
  await flushPromises();
  return wrapper;
};

describe("ConfirmacionesLectura", () => {
  it("carga el padrón y muestra el resumen X/Y con el aviso sin cuenta", async () => {
    comunidadService.obtenerConfirmacionesLectura.mockResolvedValue({
      success: true,
      data: RESPUESTA,
    });

    const wrapper = await montar();

    expect(comunidadService.obtenerConfirmacionesLectura).toHaveBeenCalledWith(7);
    expect(wrapper.text()).toContain("1 de 2 leyeron");
    expect(wrapper.text()).toContain("+ 3 sin cuenta");
    // Pestaña de leídos activa por defecto: Tadeo con fecha, sin Lucía.
    expect(wrapper.text()).toContain("Martínez, Tadeo");
    expect(wrapper.text()).not.toContain("Gómez, Lucía");
  });

  it("cambia a pendientes y muestra a quién falta confirmar", async () => {
    comunidadService.obtenerConfirmacionesLectura.mockResolvedValue({
      success: true,
      data: RESPUESTA,
    });

    const wrapper = await montar();
    await wrapper.findAll(".conf-tabs button")[1].trigger("click");

    expect(wrapper.text()).toContain("Gómez, Lucía");
    expect(wrapper.text()).toContain("Pendiente");
    expect(wrapper.find(".conf-fila:not(.leido)").exists()).toBe(true);
  });

  it("muestra un mensaje amable si el servidor falla y permite reintentar", async () => {
    comunidadService.obtenerConfirmacionesLectura.mockClear();
    comunidadService.obtenerConfirmacionesLectura
      .mockResolvedValueOnce({ success: false, message: "No podés ver las confirmaciones" })
      .mockResolvedValueOnce({ success: true, data: RESPUESTA });

    const wrapper = await montar();

    expect(wrapper.text()).toContain("No podés ver las confirmaciones");

    await wrapper.find(".conf-refrescar").trigger("click");
    await flushPromises();

    expect(comunidadService.obtenerConfirmacionesLectura).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain("1 de 2 leyeron");
  });
});
