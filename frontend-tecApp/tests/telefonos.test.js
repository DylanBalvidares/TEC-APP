import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { analizarTelefono, formatearTelefonoAR, filtrarEntradaTelefono } from "../src/utils/telefonos.js";
import { validarTelefonoAR } from "../src/utils/validators.js";
import TelefonoInput from "../src/components/ui/TelefonoInput.vue";
import ComposerWhatsapp from "../src/components/whatsapp/ComposerWhatsapp.vue";

describe("telefonos.js (espejo del backend)", () => {
  it.each([
    ["11 1234-5678", "5491112345678"],
    ["011 15-1234-5678", "5491112345678"],
    ["+5491112345678", "5491112345678"],
    ["2364889955", "5492364889955"],
    ["02364712233", "5492364712233"],
    ["5402364715375", "5492364715375"],
    ["54 0 2364 71-5375", "5492364715375"],
    ["54902364715375", "5492364715375"],
    ["005492364889955", "5492364889955"],
  ])("normaliza %s → %s", (entrada, esperado) => {
    expect(analizarTelefono(entrada)).toMatchObject({ estado: "ok", normalizado: esperado });
  });

  it.each([
    ["askjdha", /letras/],
    ["123", /código de área/],
    ["12345678", /código de área/],
    ["+59899123456", /argentinos/],
  ])("rechaza %s (%s)", (entrada, motivo) => {
    const r = analizarTelefono(entrada);
    expect(r.estado).toBe("error");
    expect(r.mensaje).toMatch(motivo);
  });

  it("vacio no es error de formato", () => {
    expect(analizarTelefono("")).toMatchObject({ estado: "vacio" });
    expect(analizarTelefono(null)).toMatchObject({ estado: "vacio" });
  });

  it("formatea para display", () => {
    expect(formatearTelefonoAR("5492364715375")).toBe("+54 9 2364 71-5375");
    expect(formatearTelefonoAR("no-valido")).toBeNull();
  });

  it("filtra caracteres en vivo", () => {
    expect(filtrarEntradaTelefono("abc2364-715375xyz")).toBe("2364-715375");
    expect(filtrarEntradaTelefono("+54 9 2364")).toBe("+54 9 2364");
  });
});

describe("validarTelefonoAR", () => {
  it("integra la regla en formularios", () => {
    expect(validarTelefonoAR("2364 71-5375")).toBe("");
    expect(validarTelefonoAR("", false)).toBe("");
    expect(validarTelefonoAR("", true)).toBe("El teléfono es obligatorio");
    expect(validarTelefonoAR("askjdha")).toMatch(/inválido/);
  });
});

describe("TelefonoInput.vue", () => {
  it("filtra letras al escribir y muestra preview válido en blur", async () => {
    const w = mount(TelefonoInput, { props: { modelValue: "" } });
    await w.find("input").setValue("abc2364715375");
    expect(w.emitted("update:modelValue")[0][0]).toBe("2364715375");
    await w.setProps({ modelValue: "2364 71-5375" });
    await w.find("input").trigger("blur");
    expect(w.text()).toContain("+54 9 2364 71-5375");
  });

  it("muestra motivo específico en blur si es inválido", async () => {
    const w = mount(TelefonoInput, { props: { modelValue: "askjdha" } });
    await w.find("input").trigger("blur");
    expect(w.text()).toMatch(/letras/);
  });
});

describe("ComposerWhatsapp.vue (bloqueo por formato)", () => {
  const ALUMNOS = [
    { id_alumno: 1, nombre: "Juan", apellido: "Pérez", nombre_tutor: "Ana", telefono_tutor: "2364 71-5375" },
    { id_alumno: 2, nombre: "Raro", apellido: "Caso", nombre_tutor: "X", telefono_tutor: "5402364715375" },
    { id_alumno: 3, nombre: "Mal", apellido: "Dato", nombre_tutor: "Y", telefono_tutor: "askjdha" },
  ];

  it("muestra el número formateado y permite enviar si es válido", async () => {
    const w = mount(ComposerWhatsapp, { props: { alumnos: ALUMNOS } });
    await w.find("select").setValue(1);
    expect(w.text()).toContain("+54 9 2364 71-5375");
    await w.find("textarea").setValue("Hola");
    const btn = w.findAll("button").find((b) => b.text().includes("Enviar WhatsApp"));
    expect(btn.attributes("disabled")).toBeUndefined();
  });

  it("acepta 54 0... (corrige troncal) y bloquea basura con motivo", async () => {
    const w = mount(ComposerWhatsapp, { props: { alumnos: ALUMNOS } });
    await w.find("select").setValue(2);
    expect(w.text()).toContain("+54 9 2364 71-5375");
    await w.find("select").setValue(3);
    expect(w.text()).toMatch(/letras/);
    const btn = w.findAll("button").find((b) => b.text().includes("Enviar WhatsApp"));
    expect(btn.attributes("disabled")).toBeDefined();
  });
});
