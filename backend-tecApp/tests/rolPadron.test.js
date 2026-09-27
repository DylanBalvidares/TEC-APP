import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ROLES_SISTEMA,
  derivarRolDesdePadron,
} from "../src/utils/rolPadron.js";

test("deriva alumno, profesor y administrativo del padrón", () => {
  assert.equal(derivarRolDesdePadron("alumno"), ROLES_SISTEMA.ALUMNO);
  assert.equal(derivarRolDesdePadron("profesor"), ROLES_SISTEMA.PROFESOR);
  assert.equal(
    derivarRolDesdePadron("administrativo"),
    ROLES_SISTEMA.ADMINISTRATIVO,
  );
});

test("normaliza mayúsculas y espacios", () => {
  assert.equal(derivarRolDesdePadron("  Alumno "), ROLES_SISTEMA.ALUMNO);
  assert.equal(derivarRolDesdePadron("PROFESOR"), ROLES_SISTEMA.PROFESOR);
});

test("NUNCA permite escalar a root desde el padrón", () => {
  assert.equal(derivarRolDesdePadron("root"), null);
  assert.equal(derivarRolDesdePadron("ROOT"), null);
});

test("roles no auto-asignables o desconocidos devuelven null", () => {
  assert.equal(derivarRolDesdePadron("bibliotecario"), null);
  assert.equal(derivarRolDesdePadron("preceptor"), null);
  assert.equal(derivarRolDesdePadron(""), null);
  assert.equal(derivarRolDesdePadron(null), null);
  assert.equal(derivarRolDesdePadron(undefined), null);
  assert.equal(derivarRolDesdePadron(8), null);
});

test("el mapa de roles del sistema conserva los ids del seed", () => {
  assert.deepEqual(ROLES_SISTEMA, {
    ALUMNO: 1,
    DELEGADO: 2,
    PROFESOR: 3,
    PRECEPTOR: 4,
    BIBLIOTECARIO: 5,
    TUTOR: 6,
    ADMINISTRATIVO: 7,
    ROOT: 8,
  });
});
