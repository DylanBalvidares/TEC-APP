import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalizarTelefonoAR,
  diagnosticarTelefono,
  validarTelefonoAR,
  whatsappConfigurado,
} from "../src/utils/whatsappProvider.js";

test("normaliza 11 local con guiones a 549 + área", () => {
  assert.equal(normalizarTelefonoAR("11 1234-5678"), "5491112345678");
});

test("normaliza 0 + 15 local a formato E.164 AR", () => {
  assert.equal(normalizarTelefonoAR("011 15-1234-5678"), "5491112345678");
});

test("conserva número ya normalizado +549", () => {
  assert.equal(normalizarTelefonoAR("+5491112345678"), "5491112345678");
});

test("acepta 10 dígitos con área sin 15 ni país", () => {
  assert.equal(normalizarTelefonoAR("2364889955"), "5492364889955");
  assert.equal(normalizarTelefonoAR("02364712233"), "5492364712233");
});

test("corrige cero troncal tras código país (54 0 ...)", () => {
  assert.equal(normalizarTelefonoAR("5402364715375"), "5492364715375");
  assert.equal(normalizarTelefonoAR("54 0 2364 71-5375"), "5492364715375");
});

test("corrige cero tras 549 y prefijo 00", () => {
  assert.equal(normalizarTelefonoAR("54902364715375"), "5492364715375");
  assert.equal(normalizarTelefonoAR("005492364889955"), "5492364889955");
});

test("rechaza teléfono inválido o vacío con motivo específico", () => {
  assert.throws(() => normalizarTelefonoAR("abc"), /letras/);
  assert.throws(() => normalizarTelefonoAR("askjdha"), /letras/);
  assert.throws(() => normalizarTelefonoAR("123"), /código de área/);
  assert.throws(() => normalizarTelefonoAR("12345678"), /código de área/);
  assert.throws(() => normalizarTelefonoAR("+59899123456"), /argentinos/);
  assert.throws(() => normalizarTelefonoAR(null), /obligatorio/);
  assert.throws(() => normalizarTelefonoAR("   "), /obligatorio/);
});

test("diagnosticarTelefono no lanza y reporta motivo", () => {
  assert.deepEqual(diagnosticarTelefono("2364889955"), {
    ok: true,
    telefono: "5492364889955",
    motivo: null,
  });
  const r = diagnosticarTelefono("askjdha");
  assert.equal(r.ok, false);
  assert.equal(r.telefono, null);
  assert.match(r.motivo, /letras/);
});

test("validarTelefonoAR retorna string vacío si válido", () => {
  assert.equal(validarTelefonoAR("2364 71-5375"), "");
  assert.equal(validarTelefonoAR("", false), "");
  assert.equal(validarTelefonoAR("", true), "El teléfono es obligatorio");
  assert.match(validarTelefonoAR("askjdha"), /letras/);
});

test("whatsappConfigurado devuelve booleano sin romper sin .env", () => {
  assert.equal(typeof whatsappConfigurado(), "boolean");
});
