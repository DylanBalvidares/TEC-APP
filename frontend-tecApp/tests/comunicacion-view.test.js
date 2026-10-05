import { describe, it, expect } from "vitest";
import { shallowMount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import ComunicacionView from "../src/components/administrador/views/ComunicacionView.vue";
import { useComunicacionStore } from "../src/stores/comunicacion.js";

const flush = () => new Promise((r) => setTimeout(r, 0));

const montar = async (query = {}, { nuevaPinia = true } = {}) => {
  if (nuevaPinia) setActivePinia(createPinia());
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { template: "<div />" } }],
  });
  await router.push({ path: "/", query });
  await router.isReady();
  const wrapper = shallowMount(ComunicacionView, {
    global: { plugins: [router] },
  });
  await flushPromises();
  await flush();
  return { wrapper, router };
};

const tabActivo = (wrapper) =>
  wrapper.findAll(".tab-btn").find((b) => b.classes().includes("active")).text();

describe("ComunicacionView — tabs", () => {
  it("muestra Noticias por defecto y cambia de tab al clickear", async () => {
    const { wrapper } = await montar();
    expect(tabActivo(wrapper)).toContain("Noticias");
    await wrapper.findAll(".tab-btn")[2].trigger("click");
    expect(tabActivo(wrapper)).toContain("WhatsApp");
    wrapper.unmount();
  });

  it("respeta el tab de la URL y lo sincroniza al navegar", async () => {
    const { wrapper, router } = await montar({ tab: "comunicados" });
    expect(tabActivo(wrapper)).toContain("Comunicados");
    await wrapper.findAll(".tab-btn")[2].trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.query.tab).toBe("mensajes");
    expect(router.currentRoute.value.query.vista).toBe("comunicacion");
    wrapper.unmount();
  });

  it("incluye la tab Emails al final sin mover las demás", async () => {
    const { wrapper, router } = await montar();
    expect(wrapper.findAll(".tab-btn")).toHaveLength(4);
    await wrapper.findAll(".tab-btn")[3].trigger("click");
    await flushPromises();
    expect(tabActivo(wrapper)).toContain("Emails");
    expect(router.currentRoute.value.query.tab).toBe("emails");
    wrapper.unmount();
  });

  it("ignora tabs inválidos de la URL", async () => {
    const { wrapper } = await montar({ tab: "inexistente" });
    expect(tabActivo(wrapper)).toContain("Noticias");
    wrapper.unmount();
  });

  it("tab pendiente (acceso externo) tiene prioridad sobre la URL", async () => {
    setActivePinia(createPinia());
    useComunicacionStore().solicitarTab("mensajes");
    const { wrapper } = await montar({}, { nuevaPinia: false });
    expect(tabActivo(wrapper)).toContain("WhatsApp");
    expect(useComunicacionStore().consumirTabPendiente()).toBeNull();
    wrapper.unmount();
  });
});
