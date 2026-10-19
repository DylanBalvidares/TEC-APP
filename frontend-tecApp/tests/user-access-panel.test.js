import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";

import UserAccessPanel from "../src/components/ui/UserAccessPanel.vue";

// Pantalla mínima del SuperUI que dependencias como `animate-fade-in` no
// afectan: el panel es autocontenido (estilos scoped propios, sin stores).

describe("UserAccessPanel", () => {
  it('se titula "Cuenta de acceso"', () => {
    const wrapper = mount(UserAccessPanel);
    expect(wrapper.text()).toContain("Cuenta de acceso");
    expect(wrapper.text()).not.toContain("Acceso al sistema");
  });

  it("arranca plegado por defecto y despliega al hacer click", async () => {
    const wrapper = mount(UserAccessPanel);
    expect(wrapper.find(".panel-fields").exists()).toBe(false);

    await wrapper.find(".desplegar-btn").trigger("click");
    expect(wrapper.find(".panel-fields").exists()).toBe(true);
  });

  it("arranca desplegado con abiertoPorDefecto", () => {
    const wrapper = mount(UserAccessPanel, {
      props: { abiertoPorDefecto: true },
    });
    expect(wrapper.find(".panel-fields").exists()).toBe(true);
  });

  it("emite los datos con enviarCredenciales al escribir", async () => {
    const wrapper = mount(UserAccessPanel, {
      props: { abiertoPorDefecto: true, defaultRolId: 1 },
    });
    const emailInput = wrapper.find('input[type="email"]');
    await emailInput.setValue("ana.paz@tecnica2.edu.ar");
    const passInput = wrapper.find(".password-field input");
    await passInput.setValue("clave1234");

    const emisiones = wrapper.emitted("update:usuarioData");
    expect(emisiones).toBeTruthy();
    const datos = emisiones.at(-1)[0];
    expect(datos.email).toBe("ana.paz@tecnica2.edu.ar");
    expect(datos.contrasena).toBe("clave1234");
    expect(datos.id_rol).toBe(1);
    expect(datos.enviarCredenciales).toBe(false);
  });

  it('"Generar" llena una contraseña de 12 caracteres y la revela', async () => {
    const wrapper = mount(UserAccessPanel, {
      props: { abiertoPorDefecto: true },
    });
    const passInput = wrapper.find(".password-field input");
    expect(passInput.attributes("type")).toBe("password");

    const generarBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Generar"));
    expect(generarBtn).toBeTruthy();
    await generarBtn.trigger("click");

    const generada = wrapper.vm.contrasena;
    expect(generada).toHaveLength(12);
    expect(generada.length).toBeGreaterThan(0);
    // Se revela automáticamente para ver la contraseña generada
    expect(passInput.attributes("type")).toBe("text");

    // El ojo la vuelve a ocultar
    const ojoBtn = wrapper.findAll("button")[2];
    await ojoBtn.trigger("click");
    expect(passInput.attributes("type")).toBe("password");
  });

  it("genera siempre 12 caracteres (la generación no falla)", async () => {
    for (let i = 0; i < 20; i += 1) {
      const wrapper = mount(UserAccessPanel, {
        props: { abiertoPorDefecto: true },
      });
      await wrapper
        .findAll("button")
        .find((b) => b.text().includes("Generar"))
        .trigger("click");
      expect(wrapper.vm.contrasena).toHaveLength(12);
    }
  });

  it("el checkbox de envío solo aparece con cuentaOpcional y emite la marca", async () => {
    const sinOpcion = mount(UserAccessPanel, { props: { abiertoPorDefecto: true } });
    expect(sinOpcion.find(".checkbox-envio").exists()).toBe(false);

    const wrapper = mount(UserAccessPanel, {
      props: { abiertoPorDefecto: true, cuentaOpcional: true },
    });
    const casilla = wrapper.find(".checkbox-envio input[type='checkbox']");
    expect(casilla.exists()).toBe(true);

    await casilla.setValue(true);
    const datos = wrapper.emitted("update:usuarioData").at(-1)[0];
    expect(datos.enviarCredenciales).toBe(true);

    // Hint del envío incluido
    expect(wrapper.text()).toContain("se genera una segura y se envía");
  });

  it("muestra la nota de 'guardar sin cuenta' solo sin contraseña ni envío", async () => {
    const wrapper = mount(UserAccessPanel, {
      props: { abiertoPorDefecto: true, cuentaOpcional: true, ocultarRol: true },
    });
    expect(wrapper.text()).toContain("queda sin cuenta de acceso");

    // Con contraseña ya no aplica
    await wrapper.find(".password-field input").setValue("clave1234");
    expect(wrapper.text()).not.toContain("queda sin cuenta de acceso");

    // Ni con la casilla de envío marcada (la cuenta se va a crear)
    await wrapper.find(".password-field input").setValue("");
    await wrapper.find(".checkbox-envio input[type='checkbox']").setValue(true);
    expect(wrapper.text()).not.toContain("queda sin cuenta de acceso");
  });

  it("si no hay nota ni casilla en flujos con cuenta obligatoria", () => {
    const wrapper = mount(UserAccessPanel, { props: { abiertoPorDefecto: true } });
    expect(wrapper.find(".panel-nota").exists()).toBe(false);
    expect(wrapper.find(".panel-envio").exists()).toBe(false);
  });

  it("el email sigue a la sugerencia aunque el panel esté desplegado (fix Generar)", async () => {
    const wrapper = mount(UserAccessPanel, {
      props: {
        abiertoPorDefecto: true,
        emailSugerido: "",
      },
    });

    // El usuario no tocó el email: si el formulario sugiere uno, el panel
    // desplegado debe actualizarlo (antes solo se sincronizaba plegado).
    await wrapper.setProps({ emailSugerido: "ana.paz@tecnica2.edu.ar" });
    expect(wrapper.find('input[type="email"]').element.value).toBe(
      "ana.paz@tecnica2.edu.ar",
    );

    // Si el usuario lo edita a mano, la sugerencia ya no lo pisa
    await wrapper.find('input[type="email"]').setValue("otro@tecnica2.edu.ar");
    await wrapper.setProps({ emailSugerido: "tercero@tecnica2.edu.ar" });
    expect(wrapper.find('input[type="email"]').element.value).toBe(
      "otro@tecnica2.edu.ar",
    );
  });

  it("en edición con cuenta precarga el email de la cuenta", () => {
    const plegado = mount(UserAccessPanel, {
      props: {
        modo: "editar",
        usuarioActual: { id_usuario: 10, email: "cuenta@tecnica2.edu.ar" },
        emailSugerido: "gmail@dellegajo.com",
      },
    });
    // Píldora de estado mientras esté plegado
    expect(plegado.text()).toContain("Cuenta vinculada");

    const wrapper = mount(UserAccessPanel, {
      props: {
        modo: "editar",
        abiertoPorDefecto: true,
        usuarioActual: { id_usuario: 10, email: "cuenta@tecnica2.edu.ar" },
        emailSugerido: "gmail@dellegajo.com",
      },
    });
    // El email de la cuenta tiene prioridad sobre la sugerencia de la ficha
    expect(wrapper.find('input[type="email"]').element.value).toBe(
      "cuenta@tecnica2.edu.ar",
    );
  });

  it("al plegar limpia la casilla y la contraseña", async () => {
    const wrapper = mount(UserAccessPanel, {
      props: { abiertoPorDefecto: true, cuentaOpcional: true },
    });
    await wrapper.find(".password-field input").setValue("algo");
    await wrapper.find(".checkbox-envio input[type='checkbox']").setValue(true);

    await wrapper.find(".desplegar-btn").trigger("click");
    // plegado → emite null (sin cuenta al guardar)
    const datos = wrapper.emitted("update:usuarioData").at(-1)[0];
    expect(datos).toBeNull();

    // Reabrir: campos en blanco
    await wrapper.find(".desplegar-btn").trigger("click");
    expect(wrapper.find(".password-field input").element.value).toBe("");
    expect(
      wrapper.find(".checkbox-envio input[type='checkbox']").element.checked,
    ).toBe(false);
  });
});
