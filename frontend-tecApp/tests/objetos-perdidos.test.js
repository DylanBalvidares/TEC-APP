import { describe, expect, it } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import ObjetosPerdidosView from "../src/components/alumno/views/ObjetosPerdidosView.vue";

const crearRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: "/alumno/objetos-perdidos", component: ObjetosPerdidosView },
    { path: "/alumno/inicio", component: { template: "<main>Inicio</main>" } },
  ],
});

describe("Objetos perdidos en desarrollo", () => {
  it("muestra solo el popup informativo al entrar a la ruta", async () => {
    const router = crearRouter();
    await router.push("/alumno/objetos-perdidos");
    await router.isReady();
    const wrapper = mount(ObjetosPerdidosView, { global: { plugins: [router] } });
    await flushPromises();

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain("Funcionalidad en desarrollo");
    expect(dialog?.textContent.toLocaleLowerCase("es")).toContain("pronto vas a poder consultar y reportar objetos");
    expect(dialog?.querySelector("input, select, textarea")).toBeNull();
    wrapper.unmount();
  });

  it("vuelve al inicio al cerrar el popup", async () => {
    const router = crearRouter();
    await router.push("/alumno/objetos-perdidos");
    await router.isReady();
    const wrapper = mount(ObjetosPerdidosView, { global: { plugins: [router] } });
    await flushPromises();

    document.body.querySelector(".btn-volver").click();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/alumno/inicio");
    wrapper.unmount();
  });
});
