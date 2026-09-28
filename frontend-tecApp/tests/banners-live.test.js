import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import BannerAviso from "../src/components/ui/BannerAviso.vue";
import DataTable from "../src/components/ui/DataTable.vue";

describe("avisos con aria-live", () => {
  it("BannerAviso error usa role alert y aria-live polite", () => {
    const wrapper = mount(BannerAviso, { props: { mensaje: "Fallo la carga" } });
    const el = wrapper.find("[aria-live]");
    expect(el.exists()).toBe(true);
    expect(el.attributes("aria-live")).toBe("polite");
    expect(el.attributes("role")).toBe("alert");
    expect(el.text()).toContain("Fallo la carga");
  });

  it("BannerAviso exito usa role status", () => {
    const wrapper = mount(BannerAviso, {
      props: { mensaje: "Guardado", variante: "exito" },
    });
    expect(wrapper.find("[aria-live]").attributes("role")).toBe("status");
  });

  it("BannerAviso sin mensaje no renderiza nada", () => {
    const wrapper = mount(BannerAviso, { props: { mensaje: "" } });
    expect(wrapper.html()).toBe("<!--v-if-->");
  });

  it("DataTable anuncia carga, error y vacio como regiones live", () => {
    const base = {
      columnas: [{ key: "nombre", titulo: "Nombre" }],
      filas: [],
    };
    const carga = mount(DataTable, { props: { ...base, cargando: true } });
    expect(carga.find('[role="status"]').exists()).toBe(true);

    const error = mount(DataTable, { props: { ...base, error: "Fallo" } });
    expect(error.find('[role="alert"]').exists()).toBe(true);

    const vacio = mount(DataTable, { props: base });
    const region = vacio.find('.empty-state[aria-live="polite"]');
    expect(region.exists()).toBe(true);
  });
});
