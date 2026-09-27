import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import { createPinia } from "pinia";
import DashboardAdministrador from "../src/components/administrador/DashboardAdministrador.vue";
import Sidebar from "../src/components/administrador/views/Sidebar.vue";

const flush = () => new Promise((r) => setTimeout(r, 0));

// El Dashboard monta vistas que hacen fetch; se mockean los servicios
vi.mock("../src/services/academico-service.js", () => ({
  obtenerAlumnos: vi.fn().mockResolvedValue([]),
  obtenerProfesores: vi.fn().mockResolvedValue([]),
  obtenerCursos: vi.fn().mockResolvedValue([]),
  obtenerHistorialAsistencias: vi.fn().mockResolvedValue([]),
  obtenerMaterias: vi.fn().mockResolvedValue({ data: [] }),
  obtenerAsignaciones: vi.fn().mockResolvedValue({ data: [] }),
  sincronizarUsuarioAlumno: vi.fn(),
  crearAlumno: vi.fn(),
  modificarAlumno: vi.fn(),
  darDeBajaAlumno: vi.fn(),
}));
vi.mock("../src/services/comunidad-service.js", () => ({
  obtenerTodosComunicados: vi.fn().mockResolvedValue([]),
  crearComunicado: vi.fn(),
  actualizarComunicado: vi.fn(),
  eliminarComunicado: vi.fn(),
}));
vi.mock("../src/services/usuarios-services.js", () => ({
  obtenerRoles: vi.fn().mockResolvedValue([]),
  obtenerUsuarios: vi.fn().mockResolvedValue([]),
  crearUsuario: vi.fn(),
  modificarUsuario: vi.fn(),
  eliminarUsuario: vi.fn(),
  obtenerTodosPermisos: vi.fn().mockResolvedValue([]),
  obtenerPermisosDeRol: vi.fn().mockResolvedValue([]),
  asignarPermisosARol: vi.fn(),
  crearRol: vi.fn(),
  modificarRol: vi.fn(),
  eliminarRol: vi.fn(),
}));

// Router en memoria: la sync de URL usa route.query / router.replace
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: "/", component: { template: "<div />" } },
    { path: "/dashboard-administrador", component: DashboardAdministrador },
  ],
});

const montarDashboard = async () => {
  await router.push("/dashboard-administrador");
  await router.isReady();
  const wrapper = mount(DashboardAdministrador, {
    global: { plugins: [router, createPinia()] },
  });
  await flush();
  return wrapper;
};

describe("DashboardAdministrador — navegación", () => {
  it("muestra Overview por defecto", async () => {
    const wrapper = await montarDashboard();
    expect(wrapper.findComponent({ name: "Overview" }).exists()).toBe(true);
    wrapper.unmount();
  });

  it("cambia de vista al emitir cambiar-vista desde el Sidebar", async () => {
    const wrapper = await montarDashboard();
    wrapper.findComponent(Sidebar).vm.$emit("cambiar-vista", "alumnos");
    await flush();

    expect(wrapper.findComponent({ name: "AlumnosView" }).exists()).toBe(true);
    wrapper.unmount();
  });

  it("ignora vistas inválidas volviendo a Overview", async () => {
    const wrapper = await montarDashboard();
    wrapper
      .findComponent(Sidebar)
      .vm.$emit("cambiar-vista", "vista-inexistente");
    await flush();

    expect(wrapper.findComponent({ name: "Overview" }).exists()).toBe(true);
    wrapper.unmount();
  });
});

describe("Sidebar — modos de visualización", () => {
  it("propaga el modo colapsado a sus clases", () => {
    const wrapper = mount(Sidebar, {
      props: { vistaActual: "overview", colapsado: true, movilAbierto: false },
    });
    expect(wrapper.find("aside").classes()).toContain("colapsado");
    expect(wrapper.find("aside").classes()).not.toContain("drawer-abierto");
    wrapper.unmount();
  });

  it("marca la vista activa y el drawer móvil abierto", () => {
    const wrapper = mount(Sidebar, {
      props: { vistaActual: "alumnos", colapsado: false, movilAbierto: true },
    });
    expect(wrapper.find("aside").classes()).toContain("drawer-abierto");
    const activos = wrapper.findAll(".nav-item.active");
    expect(activos).toHaveLength(1);
    expect(activos[0].text()).toContain("Alumnos");
    wrapper.unmount();
  });

  it("emite cambiar-vista al hacer click en un ítem", async () => {
    const wrapper = mount(Sidebar, {
      props: { vistaActual: "overview", colapsado: false, movilAbierto: false },
    });
    await wrapper.findAll(".nav-item")[1].trigger("click");
    expect(wrapper.emitted("cambiar-vista")[0]).toEqual(["alumnos"]);
    wrapper.unmount();
  });
});
