import { test, after } from "node:test";
import assert from "node:assert/strict";

import {
  enviarEmailVerificacion,
  enviarEmailAlumno,
  fijarTransporter,
  reiniciarTransporter,
} from "../src/utils/sendMail.js";

after(() => {
  reiniciarTransporter();
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASS;
});

test("sin credenciales rechaza con 500 explícito", async (t) => {
  reiniciarTransporter();
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASS;

  await assert.rejects(enviarEmailVerificacion("123456", "a@b.c"), /credenciales/);
  await assert.rejects(enviarEmailAlumno("Hola", "cuerpo", "a@b.c"), /credenciales/);
  void t;
});

test("enviarEmailVerificacion compone asunto y codigo", async () => {
  const enviados = [];
  fijarTransporter({
    sendMail: async (opciones) => {
      enviados.push(opciones);
      return { messageId: "fake-1" };
    },
  });

  const info = await enviarEmailVerificacion("654321", "a@b.c");

  assert.equal(info.messageId, "fake-1");
  assert.equal(enviados[0].to, "a@b.c");
  assert.equal(enviados[0].subject, "Código de verificación");
  assert.match(enviados[0].html, /654321/);
});

test("enviarEmailAlumno convierte saltos y propaga errores", async () => {
  const enviados = [];
  fijarTransporter({
    sendMail: async (opciones) => {
      enviados.push(opciones);
      return { messageId: "fake-2" };
    },
  });

  await enviarEmailAlumno("Asunto", "línea1\nlínea2", "b@c.d");
  assert.match(enviados[0].html, /línea1<br>línea2/);

  fijarTransporter({
    sendMail: async () => {
      throw new Error("smtp caído");
    },
  });
  await assert.rejects(enviarEmailAlumno("A", "c", "b@c.d"), /Error al enviar/);
});
