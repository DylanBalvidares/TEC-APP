import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DataTable from "../src/components/ui/DataTable.vue";

const COLUMNAS = [
  { key: "apellido", titulo: "Alumno", ordenable: true },
  { key: "dni", titulo: "DNI", ordenable: true },
  { key: "curso.nombre", titulo: "Curso" },
  { key: "__acciones", titulo: "Acciones" },
];

const FILAS = [
  { id_alumno: 1, apellido: "Perez", dni: "111", curso: { nombre: "1A" } },
  { id_alumno: 2, apellido: "Gomez", dni: "222", curso: { nombre: "2B" } },
];

function montar(props = {}, slots = {}) {
  return mount(DataTable, {
    props: {
      columnas: COLUMNAS,
      filas: FILAS,
      claveFila: "id_alumno",
      total: 2,
      pagina: 1,
      porPagina: 10,
      ...props,
    },
    slots,
  });
}

describe("DataTable", () => {
  it("renderiza columnas, filas y celdas anidadas por path", () => {
    const wrapper = montar();
    expect(wrapper.findAll("thead th")).toHaveLength(4);
    expect(wrapper.findAll("tbody tr")).toHaveLength(2);
    expect(wrapper.text()).toContain("Perez");
    expect(wrapper.text()).toContain("1A");
  });

  it("emite ordenar con key y getter al pulsar el th", async () => {
    const wrapper = montar();
    await wrapper.findAll("button.th-sort")[0].trigger("click");
    expect(wrapper.emitted("ordenar")[0]).toEqual(["apellido", null]);
  });

  it("marca aria-sort e icono segun orden activo", () => {
    const wrapper = montar({ ordenKey: "dni", ordenDir: "desc" });
    const ths = wrapper.findAll("thead th");
    expect(ths[1].attributes("aria-sort")).toBe("descending");
    expect(ths[0].attributes("aria-sort")).toBe("none");
    expect(wrapper.find("thead th:nth-child(2) i").classes()).toContain("ti-caret-down-filled");
  });

  it("usa slots de celda y acciones", () => {
    const wrapper = montar(
      {},
      {
        "celda-apellido": `<template #celda-apellido="{ valor }"><strong>{{ valor }}</strong></template>`,
        acciones: `<template #acciones="{ fila }"><button class="ver">Ver {{ fila.id_alumno }}</button></template>`,
      },
    );
    expect(wrapper.find("tbody strong").text()).toBe("Perez");
    expect(wrapper.findAll("button.ver")).toHaveLength(2);
  });

  it("muestra carga, error y vacio", () => {
    expect(montar({ cargando: true, textoCarga: "Cargando..." }).text()).toContain("Cargando...");
    const err = montar({ filas: [], error: "Fallo" });
    expect(err.text()).toContain("Fallo");
    const vacio = montar({ filas: [], busquedaActiva: true, textoVacioBusqueda: "Nada" });
    expect(vacio.text()).toContain("Nada");
  });

  it("reintentar emite el evento", async () => {
    const wrapper = montar({ filas: [], error: "Fallo" });
    await wrapper.find(".error-banner button").trigger("click");
    expect(wrapper.emitted("reintentar")).toHaveLength(1);
  });

  it("seleccion por fila y por pagina", async () => {
    const wrapper = montar({ seleccionable: true, seleccion: [] });
    await wrapper.find("tbody input[type=checkbox]").setValue(true);
    expect(wrapper.emitted("update:seleccion")[0]).toEqual([[1]]);
    await wrapper.find("thead input[type=checkbox]").setValue(true);
    expect(wrapper.emitted("update:seleccion")[1]).toEqual([[1, 2]]);
  });

  it("densidad compacta aplica la clase", () => {
    expect(montar({ densidad: "compacta" }).classes()).toContain("datatable-compacta");
  });

  it("pagina delega en Pagination", async () => {
    const wrapper = montar({ total: 25, porPagina: 10 });
    const botones = wrapper.findAll(".page-btn");
    await botones[botones.length - 1].trigger("click");
    expect(wrapper.emitted("pagina")).toBeTruthy();
  });
});
