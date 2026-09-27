/**
 * Exporta una lista de objetos a un archivo CSV descargable.
 *
 * @param {Array<Object>} filas - Registros a exportar
 * @param {Object} opciones
 * @param {Object<string, string|Function>} opciones.columnas
 *   Mapa nombreDeColumna → campo del objeto o función (fila) => valor.
 *   Ej: { "Nombre": "nombre", "Curso": (a) => a.curso?.nombre_curso || "Sin asignar" }
 * @param {string} [opciones.nombreArchivo="exportacion"] - Nombre sin extensión
 */
export function exportarCsv(filas, { columnas, nombreArchivo = "exportacion" }) {
    if (!Array.isArray(filas) || filas.length === 0) {
        throw new Error("No hay datos para exportar.");
    }
    if (!columnas || Object.keys(columnas).length === 0) {
        throw new Error("No se definieron columnas para la exportación.");
    }

    const encabezados = Object.keys(columnas);

    const celda = (valor) => {
        const texto = valor === null || valor === undefined ? "" : String(valor);
        // Escapar comillas y rodear si contiene separadores/saltos
        const escapado = texto.replace(/"/g, '""');
        return /[";\n,]/.test(escapado) ? `"${escapado}"` : escapado;
    };

    const lineas = [encabezados];
    for (const fila of filas) {
        lineas.push(
            encabezados.map((col) => {
                const def = columnas[col];
                const valor = typeof def === "function" ? def(fila) : fila?.[def];
                return celda(valor);
            }),
        );
    }

    const csv = lineas
        .map((linea) => linea.join(";"))
        .join("\r\n");

    // BOM para que Excel respete los acentos
    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    const fecha = new Date().toISOString().slice(0, 10);
    enlace.href = url;
    enlace.download = `${nombreArchivo}_${fecha}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
}
