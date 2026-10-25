import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import DashboardPreceptor from "../src/components/preceptor/DashboardPreceptor.vue";
import { useAuthStore } from "../src/stores/auth.js";
import { navigationByRole } from "../src/config/role-navigation.js";

const UsuarioRuta = { template: "<div>Inicio del preceptor</div>" };

afterEach(() => {
  document.body.querySelectorAll("[role='dialog']").forEach((element) => element.remove());
  document.body.style.overflow = "";
});

describe("Perfil del preceptor", () => {
  it("abre Ver perfil desde el menú de usuario y muestra los datos de la sesión", async () => {
    const pinia = createPinia();
    const auth = useAuthStore(pinia);
    auth.login("token-preceptor", {
      id_usuario: 45,
      nombre: "María",
      apellido: "López",
      email: "mlopez@tecnica2.edu.ar",
      nombre_rol: "preceptor",
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{
        path: "/preceptor",
        component: DashboardPreceptor,
        children: navigationByRole.preceptor.flatMap((group) => group.items).map(({ to }) => ({
          path: to.replace("/preceptor/", ""),
          component: UsuarioRuta,
        })),
      }],
    });
    await router.push("/preceptor/inicio");
    await router.isReady();
    const wrapper = mount(DashboardPreceptor, {
      global: {
        plugins: [pinia, router],
        stubs: { CampanitaNotificaciones: true },
      },
    });
    await flushPromises();

    await wrapper.find('[aria-label="Menú de usuario"]').trigger("click");
    await wrapper.findAll(".menu-item").find((button) => button.text().includes("Ver perfil")).trigger("click");
    await flushPromises();

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain("Ver perfil");
    expect(dialog.textContent).toContain("María");
    expect(dialog.textContent).toContain("López");
    expect(dialog.textContent).toContain("mlopez@tecnica2.edu.ar");
    expect(dialog.textContent).toContain("Preceptor");
    wrapper.unmount();
  });
});
