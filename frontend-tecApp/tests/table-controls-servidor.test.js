import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";
import { useTableControls } from "../src/composables/useTableControls.js";

const PAGINA_1 = [
  { id_alumno: 1, apellido: "Perez" },
  { id_alumno: 2, apellido: "Gomez" },
];

function controlesServidor(cargarPagina, extra = {}) {
  return useTableControls(ref([]), {
    pageSize: 10,
    modo: "servidor",
    recargaDebounce: 10,
    cargarPagina,
    ...extra,
  });
}

const esperar = () => new Promise((r) => setTimeout(r, 40));

describe("useTableControls modo servidor", () => {
  it("carga inicial y expone filas/total", async () => {
    const cargar = vi.fn().mockResolvedValue({ data: PAGINA_1, total: 42 });
    const c = controlesServidor(cargar);
    await esperar();
    expect(cargar).toHaveBeenCalledTimes(1);
    expect(c.paginatedData.value).toEqual(PAGINA_1);
    expect(c.filteredData.value).toEqual(PAGINA_1);
    expect(c.totalItems.value).toBe(42);
    expect(c.totalPages.value).toBe(5);
  });

  it("la busqueda recarga con debounce pasando q", async () => {
    const cargar = vi.fn().mockResolvedValue({ data: [], total: 0 });
    const c = controlesServidor(cargar);
    await esperar();
    cargar.mockClear();
    c.searchText.value = "a";
    c.searchText.value = "an";
    await esperar();
    const llamadas = cargar.mock.calls.filter((args) => args[0].q === "an");
    expect(llamadas.length).toBeGreaterThanOrEqual(1);
    expect(llamadas[0][0]).toMatchObject({ page: 1, limit: 10, q: "an" });
  });

  it("pagina y orden viajan al servidor", async () => {
    const cargar = vi.fn().mockResolvedValue({ data: PAGINA_1, total: 25 });
    const c = controlesServidor(cargar);
    await esperar();
    cargar.mockClear();
    c.toggleSort("apellido");
    await esperar();
    expect(cargar).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "apellido", order: "asc" }),
    );
    cargar.mockClear();
    c.goToPage(2);
    await esperar();
    expect(cargar).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });

  it("los filtros viajan y recargar() fuerza la carga", async () => {
    const cargar = vi.fn().mockResolvedValue({ data: [], total: 0 });
    const c = controlesServidor(cargar);
    await esperar();
    cargar.mockClear();
    c.setFilter("estado", "activo");
    await esperar();
    expect(cargar).toHaveBeenCalledWith(
      expect.objectContaining({ filtros: { estado: "activo" } }),
    );
    cargar.mockClear();
    await c.recargar();
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it("un fallo deja lista vacia sin romper", async () => {
    const c = controlesServidor(vi.fn().mockRejectedValue(new Error("red")));
    await esperar();
    expect(c.paginatedData.value).toEqual([]);
    expect(c.totalItems.value).toBe(0);
  });

  it("modo local sigue intacto sin cargarPagina", () => {
    const c = useTableControls(ref(PAGINA_1), { pageSize: 1 });
    expect(c.paginatedData.value).toEqual([PAGINA_1[0]]);
    expect(c.totalItems.value).toBe(2);
  });
});
