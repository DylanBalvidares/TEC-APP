import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import EstadoWhatsapp from "../src/components/whatsapp/EstadoWhatsapp.vue";
import HistorialMensajes from "../src/components/whatsapp/HistorialMensajes.vue";
import ComposerWhatsapp from "../src/components/whatsapp/ComposerWhatsapp.vue";
import { formatoFechaHora } from "../src/composables/useFechaHora.js";

const MENSAJE = {
  id_mensaje: 1,
  id_remitente: 7,
  id_destinatario: 3,
  nombre_destinatario: "Tutor de Pérez, Juan",
  telefono_destino: "5491112345678",
  cuerpo: "Hola, esto es una prueba",
  fecha_envio: "2026-09-01T10:00:00.000Z",
  estado: "enviado",
  leido: false,
};

describe("formatoFechaHora", () => {
  it("formatea en es-AR y tolera valores vacíos/inválidos", () => {
    expect(formatoFechaHora(null)).toBe("—");
    expect(formatoFechaHora("no-fecha")).toBe("—");
    expect(formatoFechaHora("2026-09-01T10:00:00.000Z")).toContain("2026");
  });
});

describe("EstadoWhatsapp.vue", () => {
  it.each([
    ["enviado", "sp-activo", "Enviado"],
    ["fallido", "sp-baja", "Fallido"],
    ["pendiente", "sp-pendiente", "Pendiente"],
    ["leido", "sp-leido", "Leído"],
  ])("estado %s → clase %s (%s)", (estado, clase, texto) => {
    const w = mount(EstadoWhatsapp, { props: { estado } });
    expect(w.classes()).toContain(clase);
    expect(w.text()).toBe(texto);
  });
});

describe("HistorialMensajes.vue", () => {
  it("muestra estado vacío cuando no hay mensajes", () => {
    const w = mount(HistorialMensajes, { props: { mensajes: [] } });
    expect(w.text()).toContain("No hay mensajes todavía.");
    expect(w.find("table").exists()).toBe(false);
  });

  it("renderiza fila con pills y emite ver al click en detalle", async () => {
    const w = mount(HistorialMensajes, { props: { mensajes: [MENSAJE] } });
    expect(w.text()).toContain("Tutor de Pérez, Juan");
    expect(w.text()).toContain("Enviado");
    expect(w.text()).toContain("Pendiente"); // pill de lectura
    await w.find('button[aria-label="Ver detalle del mensaje"]').trigger("click");
    expect(w.emitted("ver")).toBeTruthy();
    expect(w.emitted("ver")[0][0]).toMatchObject({ id_mensaje: 1 });
  });

  it("en modo admin muestra remitente y acciones de gestión", async () => {
    const w = mount(HistorialMensajes, {
      props: { mensajes: [MENSAJE], mostrarRemitente: true, mostrarAcciones: true, mapaRoles: { 7: "root" } },
    });
    expect(w.text()).toContain("#7");
    expect(w.text()).toContain("root");
    await w.find('button[aria-label="Reenviar mensaje"]').trigger("click");
    expect(w.emitted("reenviar")).toBeTruthy();
    await w.find('button[aria-label="Eliminar registro"]').trigger("click");
    expect(w.emitted("eliminar")).toBeTruthy();
  });

  it("resalta filas no leídas", () => {
    const w = mount(HistorialMensajes, { props: { mensajes: [MENSAJE] } });
    expect(w.find("tr.row-unread").exists()).toBe(true);
  });
});

describe("ComposerWhatsapp.vue", () => {
  const ALUMNOS = [
    { id_alumno: 1, nombre: "Juan", apellido: "Pérez", nombre_tutor: "Ana", telefono_tutor: "1112345678" },
    { id_alumno: 2, nombre: "María", apellido: "Gómez", nombre_tutor: "Luis", telefono_tutor: null },
  ];

  it("filtra alumnos por búsqueda", async () => {
    const w = mount(ComposerWhatsapp, { props: { alumnos: ALUMNOS } });
    const input = w.find('input[aria-label="Buscar alumno"]');
    await input.setValue("gómez");
    const options = w.findAll("select option");
    // placeholder + 1 filtrado
    expect(options.length).toBe(2);
    expect(options[1].text()).toContain("Gómez");
  });

  it("muestra alerta cuando el alumno no tiene teléfono", async () => {
    const w = mount(ComposerWhatsapp, { props: { alumnos: ALUMNOS } });
    const select = w.find("select");
    await select.setValue(2);
    expect(w.text()).toContain("Sin teléfono registrado");
    expect(w.find(".destino-alerta").exists()).toBe(true);
    // botón deshabilitado sin teléfono
    const btn = w.findAll("button").find((b) => b.text().includes("Enviar WhatsApp"));
    expect(btn.attributes("disabled")).toBeDefined();
  });

  it("las plantillas rellenan el mensaje y el contador avisa cerca del límite", async () => {
    const w = mount(ComposerWhatsapp, { props: { alumnos: ALUMNOS } });
    const chips = w.findAll(".plantillas button");
    expect(chips.length).toBeGreaterThan(0);
    await chips[0].trigger("click");
    expect(w.find("textarea").element.value.length).toBeGreaterThan(0);
    await w.find("select").setValue(1);
    const btn = w.findAll("button").find((b) => b.text().includes("Enviar WhatsApp"));
    expect(btn.attributes("disabled")).toBeUndefined();
  });

  it("abre modal de confirmación y emite enviar al confirmar", async () => {
    const w = mount(ComposerWhatsapp, {
      props: { alumnos: ALUMNOS },
      global: { stubs: { Teleport: true } },
    });
    await w.find("select").setValue(1);
    await w.find("textarea").setValue("Hola tutor");
    const btn = w.findAll("button").find((b) => b.text().includes("Enviar WhatsApp"));
    await btn.trigger("click");
    expect(w.text()).toContain("Confirmar envío");
    const confirmar = w.findAll("button").find((b) => b.text().includes("Confirmar envío"));
    await confirmar.trigger("click");
    expect(w.emitted("enviar")).toBeTruthy();
    expect(w.emitted("enviar")[0][0]).toMatchObject({ id_alumno: 1, cuerpo: "Hola tutor" });
  });
});
