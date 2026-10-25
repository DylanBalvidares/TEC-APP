import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Login from "../src/components/auth/Login.vue";
import Registro from "../src/components/auth/Registro.vue";

const rutas = [
  { path: "/login", component: Login },
  { path: "/registro", component: Registro },
  { path: "/", component: { template: "<div />" } },
];

describe("Identidad visual de autenticación", () => {
  it.each([
    ["Inicio de sesión", Login, "/login"],
    ["Activación de cuenta", Registro, "/registro"],
  ])("muestra el logo escolar accesible en %s", async (_nombre, componente, ruta) => {
    const router = createRouter({ history: createMemoryHistory(), routes: rutas });
    await router.push(ruta);
    await router.isReady();
    const wrapper = mount(componente, { global: { plugins: [router, createPinia()] } });
    const logo = wrapper.find('.logo-dot img');
    expect(logo.exists()).toBe(true);
    expect(logo.attributes("src")).toBe("/logoEscuela.png");
    expect(logo.attributes("alt")).toBe("Logo de la escuela");
    wrapper.unmount();
  });
});
