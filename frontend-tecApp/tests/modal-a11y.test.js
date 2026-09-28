import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import Modal from "../src/components/ui/Modal.vue";

function montar(props = {}, slots = {}) {
  return mount(Modal, {
    props: { modelValue: true, title: "Confirmar", ...props },
    slots: {
      default: `<div><input id="a" /><button id="b">Ok</button></div>`,
      ...slots,
    },
    attachTo: document.body,
  });
}

describe("Modal accesibilidad", () => {
  it("expone role dialog con aria-modal y aria-labelledby al titulo", () => {
    montar();
    // Teleport mueve el diálogo a body: se busca en el documento.
    const dialogo = document.body.querySelector('[role="dialog"]');
    expect(dialogo).not.toBeNull();
    expect(dialogo.getAttribute("aria-modal")).toBe("true");
    const labelledby = dialogo.getAttribute("aria-labelledby");
    expect(labelledby).toBeTruthy();
    expect(document.body.querySelector(`#${labelledby}`).textContent).toBe("Confirmar");
  });

  it("Escape cierra el modal", async () => {
    const wrapper = montar();
    await window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await flushPromises();
    expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
  });

  it("Tab circular: del ultimo vuelve al primero", async () => {
    montar();
    await flushPromises();
    const dialogo = document.body.querySelector('[role="dialog"]');
    const botones = dialogo.querySelectorAll("button");
    const ultimo = botones[botones.length - 1];
    ultimo.focus();
    expect(document.activeElement).toBe(ultimo);
    dialogo.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).not.toBe(ultimo);
  });

  it("restaura el foco al cerrar", async () => {
    const disparador = document.createElement("button");
    document.body.appendChild(disparador);
    disparador.focus();
    const wrapper = montar({ modelValue: false });
    await wrapper.setProps({ modelValue: true });
    await wrapper.setProps({ modelValue: false });
    expect(document.activeElement).toBe(disparador);
    disparador.remove();
  });

  it("bloquearCierre evita el cierre y avisa", async () => {
    const wrapper = montar({ bloquearCierre: true });
    await window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await flushPromises();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(wrapper.emitted("cierre-bloqueado")).toHaveLength(1);
  });
});
