import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import RoleSidebar from "../src/components/ui/RoleSidebar.vue";
import { navigationByRole } from "../src/config/role-navigation.js";

const flatten = (groups) => groups.flatMap((group) => group.items);

describe("RoleSidebar", () => {
  it("usa el gradiente bordó de Preceptor y mantiene el texto legible", () => {
    const archivo = path.resolve(process.cwd(), "src/components/ui/RoleSidebar.vue");
    const css = readFileSync(archivo, "utf8");

    expect(css).toContain("background: linear-gradient(180deg, #ca0d0d, #420101)");
    expect(css).toContain("color: rgba(255,255,255,.92)");
    expect(css).toContain(".role-sidebar-link.active { background: rgba(255,255,255,.22); color: #fff");
  });

  it("renderiza secciones agrupadas y marca la ruta actual", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: flatten(navigationByRole.profesor).map(({ to }) => ({
        path: to,
        component: { template: "<div />" },
      })),
    });
    await router.push("/profesor/cursos");
    const wrapper = mount(RoleSidebar, {
      props: {
        id: "profesor-sidebar",
        label: "Secciones del docente",
        groups: navigationByRole.profesor,
      },
      global: { plugins: [router] },
    });

    expect(wrapper.findAll(".role-sidebar-group h2").map((node) => node.text()))
      .toContain("Mis cursos · Académico");
    expect(wrapper.find('a[href="/profesor/cursos"]').classes()).toContain("active");
    expect(wrapper.find("aside").attributes("aria-label")).toBe("Secciones del docente");
    wrapper.unmount();
  });

  it("expone drawer móvil y emite close al tocar overlay o enlace", async () => {
    const wrapper = mount(RoleSidebar, {
      props: {
        id: "alumno-sidebar",
        label: "Navegación del alumno",
        groups: navigationByRole.alumno,
        open: true,
      },
      global: {
        stubs: { RouterLink: { template: '<a @click="$emit(\'click\')"><slot /></a>', emits: ["click"] } },
      },
    });

    expect(wrapper.find("aside").classes()).toContain("open");
    await wrapper.find(".role-sidebar-overlay").trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
    await wrapper.find(".role-sidebar-link").trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(2);
    wrapper.unmount();
  });

  it("limita los enlaces a las rutas de cada rol y no incluye rutas administrativas", () => {
    const alumno = flatten(navigationByRole.alumno).map((item) => item.to);
    const bibliotecario = flatten(navigationByRole.bibliotecario).map((item) => item.to);
    expect(alumno).toContain("/alumno/objetos-perdidos");
    expect(bibliotecario).toEqual([
      "/biblioteca", "/biblioteca/libros", "/biblioteca/recursos", "/biblioteca/prestamos",
    ]);
    expect(Object.values(navigationByRole).flatMap(flatten).every((item) => !item.to.includes("administrador"))).toBe(true);
  });
});
