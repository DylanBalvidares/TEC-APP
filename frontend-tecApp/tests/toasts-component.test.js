import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import Toasts from "../src/components/ui/Toasts.vue";
import { toast, usarToasts } from "../src/services/toast-service.js";

// El componente usa <Teleport to="body">: el contenido vive en document.body,
// no dentro del wrapper. Se consulta el document directamente.
describe("Toasts.vue", () => {
  beforeEach(() => {
    const { toasts } = usarToasts();
    toasts.splice(0, toasts.length);
    document.body.innerHTML = "";
  });

  it("renderiza los toasts activos con su tipo y mensaje", async () => {
    const wrapper = mount(Toasts, { attachTo: document.body });
    toast.success("Operación exitosa");
    await wrapper.vm.$nextTick();

    const { toasts } = usarToasts();
    expect(toasts.length).toBe(1);

    const items = document.querySelectorAll(".toast-item");
    expect(items.length).toBe(1);
    expect(document.querySelector(".toast-success")).toBeTruthy();
    expect(document.body.textContent).toContain("Operación exitosa");
    wrapper.unmount();
  });

  it("permite cerrar un toast desde el botón", async () => {
    const wrapper = mount(Toasts, { attachTo: document.body });
    const id = toast.info("Cerrar me");
    await wrapper.vm.$nextTick();

    expect(document.querySelectorAll(".toast-item").length).toBe(1);
    document.querySelector(".toast-close").click();
    await wrapper.vm.$nextTick();

    const { toasts } = usarToasts();
    expect(toasts.find((t) => t.id === id)).toBeUndefined();
    expect(document.querySelectorAll(".toast-item").length).toBe(0);
    wrapper.unmount();
  });
});
