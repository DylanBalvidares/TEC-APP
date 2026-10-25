import { describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import LoadingSkeleton from "../src/components/ui/LoadingSkeleton.vue";
import AnimatedRouterView from "../src/components/ui/AnimatedRouterView.vue";

describe("Estados de carga y navegación", () => {
  it("anuncia la carga y representa filas de skeleton configurables", () => {
    const wrapper = mount(LoadingSkeleton, {
      props: { label: "Cargando cursos", rows: 3, columns: 2 },
    });
    expect(wrapper.find('[role="status"]').attributes("aria-busy")).toBe("true");
    expect(wrapper.text()).toContain("Cargando cursos");
    expect(wrapper.findAll(".skeleton-row")).toHaveLength(3);
    expect(wrapper.findAll(".skeleton-cell")).toHaveLength(6);
    wrapper.unmount();
  });

  it("cambia la vista de ruta con la transición común", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/uno", component: { template: "<p>Primera vista</p>" } },
        { path: "/dos", component: { template: "<p>Segunda vista</p>" } },
      ],
    });
    await router.push("/uno");
    await router.isReady();
    const wrapper = mount(AnimatedRouterView, { global: { plugins: [router] } });
    expect(wrapper.text()).toContain("Primera vista");
    await router.push("/dos");
    await flushPromises();
    expect(wrapper.text()).toContain("Segunda vista");
    wrapper.unmount();
  });
});
