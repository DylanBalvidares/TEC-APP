import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ref } from "vue";
import { useTableControls } from "../src/composables/useTableControls.js";
import { exportarCsv } from "../src/utils/exportCsv.js";

describe("useTableControls — ordenamiento", () => {
  const datos = [
    { id: 1, nombre: "carla", nota: 7 },
    { id: 2, nombre: "Ana", nota: 9 },
    { id: 3, nombre: "bruno", nota: 4 },
  ];

  const crear = () => useTableControls(ref([...datos]));

  it("ordena asc por columna de texto sin distinguir mayúsculas", () => {
    const { toggleSort, filteredData, sortKey, sortDir } = crear();
    toggleSort("nombre");
    expect(sortKey.value).toBe("nombre");
    expect(sortDir.value).toBe("asc");
    expect(filteredData.value.map((d) => d.nombre)).toEqual([
      "Ana",
      "bruno",
      "carla",
    ]);
  });

  it("alterna asc → desc → sin orden", () => {
    const { toggleSort, filteredData, sortKey } = crear();
    toggleSort("nota"); // asc
    expect(filteredData.value.map((d) => d.nota)).toEqual([4, 7, 9]);
    toggleSort("nota"); // desc
    expect(filteredData.value.map((d) => d.nota)).toEqual([9, 7, 4]);
    toggleSort("nota"); // sin orden
    expect(sortKey.value).toBeNull();
    expect(filteredData.value.map((d) => d.nota)).toEqual([7, 9, 4]);
  });

  it("soporta getter personalizado (ej. campo anidado)", () => {
    const conCurso = [
      { id: 1, curso: { nombre_curso: "3°B" } },
      { id: 2, curso: { nombre_curso: "1°A" } },
    ];
    const { toggleSort, filteredData } = useTableControls(ref(conCurso));
    toggleSort("curso", (i) => i.curso?.nombre_curso);
    expect(filteredData.value.map((d) => d.id)).toEqual([2, 1]);
  });

  it("resetea la página al reordenar", () => {
    const muchas = Array.from({ length: 30 }, (_, i) => ({ id: i + 1 }));
    const { toggleSort, goToPage, currentPage, filteredData, paginatedData } =
      useTableControls(ref(muchas), { pageSize: 10 });
    goToPage(3);
    expect(currentPage.value).toBe(3);
    toggleSort("id");
    expect(currentPage.value).toBe(1);
    expect(filteredData.value).toHaveLength(30); // lista completa filtrada
    expect(paginatedData.value).toHaveLength(10); // página recortada
  });

  it("aplica filterFn incluso sin texto de búsqueda (visibilidad condicional)", () => {
    const alumnos = [
      { id: 1, nombre: "Ana", estado: "activo" },
      { id: 2, nombre: "Beto", estado: "baja" },
    ];
    const verBajas = ref(false);
    const { filteredData } = useTableControls(ref(alumnos), {
      filterFn: (item, q) => {
        if (!verBajas.value && item.estado === "baja") return false;
        return `${item.nombre} ${item.estado}`.toLowerCase().includes(q);
      },
    });
    // Sin búsqueda: las bajas igual se ocultan
    expect(filteredData.value.map((a) => a.id)).toEqual([1]);

    verBajas.value = true;
    expect(filteredData.value.map((a) => a.id)).toEqual([1, 2]);
  });
});

describe("exportarCsv", () => {
  let anchorMock;

  beforeEach(() => {
    anchorMock = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValue(anchorMock);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => {});
    vi.spyOn(document.body, "removeChild").mockImplementation(() => {});
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() });
    vi.stubGlobal(
      "Blob",
      class {
        constructor(contenido) {
          this.contenido = contenido;
        }
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("genera el blob y dispara la descarga con nombre y fecha", () => {
    exportarCsv(
      [{ nombre: "Ana", curso: "1°A" }],
      { columnas: { Nombre: "nombre", Curso: "curso" }, nombreArchivo: "alumnos" },
    );

    expect(anchorMock.click).toHaveBeenCalledOnce();
    expect(anchorMock.download).toMatch(/^alumnos_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("escapa valores con separador y comillas", () => {
    let capturado;
    vi.stubGlobal(
      "Blob",
      class {
        constructor(contenido) {
          capturado = contenido;
        }
      },
    );

    exportarCsv(
      [{ nombre: 'Ana "La Jefa"; directora' }],
      { columnas: { Nombre: "nombre" } },
    );

    const csv = capturado[0].replace(/^\uFEFF/, "");
    expect(csv.split("\r\n")[1]).toBe('"Ana ""La Jefa""; directora"');
  });

  it("lanza error si no hay datos o columnas", () => {
    expect(() => exportarCsv([], { columnas: { A: "a" } })).toThrow();
    expect(() =>
      exportarCsv([{ a: 1 }], { columnas: {} }),
    ).toThrow();
  });

  it("soporta columnas calculadas con función", () => {
    let capturado;
    vi.stubGlobal(
      "Blob",
      class {
        constructor(contenido) {
          capturado = contenido;
        }
      },
    );

    exportarCsv(
      [{ nombre: "Ana", curso: { nombre: "1°A" } }],
      { columnas: { Curso: (f) => f.curso?.nombre } },
    );

    expect(capturado[0]).toContain("1°A");
  });
});
