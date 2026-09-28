import { describe, it, expect, beforeEach } from "vitest";
import { defineComponent, ref } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import { useTableControls } from "../src/composables/useTableControls.js";

const DATOS = [
  { id: 1, nombre: "Ana", estado: "activo" },
  { id: 2, nombre: "Bruno", estado: "baja" },
  { id: 3, nombre: "Carla", estado: "activo" },
];

function crearRouter(queryInicial = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { template: "<div />" } }],
  });
  return router;
}

function montarControles(datos, router, queryInicial = {}) {
  let controles = null;
  const Comp = defineComponent({
    setup() {
      controles = useTableControls(ref(datos), {
        pageSize: 1,
        syncUrl: { route: router.currentRoute, router },
        syncDebounce: 10,
      });
      return () => null;
    },
    template: "<div />",
  });
  const wrapper = mount(Comp, { global: { plugins: [router] } });
  return { wrapper, get: () => controles };
}

const esperarSync = () => new Promise((r) => setTimeout(r, 50));

describe("useTableControls syncUrl", () => {
  let router = null;

  beforeEach(async () => {
    router = crearRouter();
    router.push("/");
    await router.isReady();
  });

  it("escribir en la busqueda actualiza el query", async () => {
    const { get } = montarControles(DATOS, router);
    await flushPromises();
    get().searchText.value = "ana";
    await esperarSync();
    expect(router.currentRoute.value.query.q).toBe("ana");
  });

  it("cambiar pagina y orden se refleja en el query", async () => {
    const { get } = montarControles(DATOS, router);
    await flushPromises();
    get().toggleSort("nombre");
    get().goToPage(2);
    await esperarSync();
    expect(router.currentRoute.value.query.pag).toBe("2");
    expect(router.currentRoute.value.query.orden).toBe("nombre");
    expect(router.currentRoute.value.query.dir).toBe("asc");
  });

  it("los filtros por campo viajan como parametros", async () => {
    const { get } = montarControles(DATOS, router);
    await flushPromises();
    get().setFilter("estado", "activo");
    await esperarSync();
    expect(router.currentRoute.value.query.estado).toBe("activo");
  });

  it("entrar con ?q=...&pag=2 hidrata el estado", async () => {
    await router.push({ path: "/", query: { q: "bruno", pag: "2", estado: "baja" } });
    const { get } = montarControles(DATOS, router);
    await flushPromises();
    expect(get().searchText.value).toBe("bruno");
    expect(get().currentPage.value).toBe(2);
    expect(get().filters.value).toMatchObject({ estado: "baja" });
  });

  it("limpiar filtros borra los parametros", async () => {
    await router.push({ path: "/", query: { q: "ana", pag: "2", estado: "activo" } });
    const { get } = montarControles(DATOS, router);
    await flushPromises();
    expect(get().searchText.value).toBe("ana");
    get().clearFilters();
    get().goToPage(1);
    await esperarSync();
    expect(router.currentRoute.value.query).toEqual({});
  });
});
