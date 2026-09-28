import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

// Claves reservadas del query string para la sincronización de URL (Q5).
const QUERY_Q = "q";
const QUERY_PAG = "pag";
const QUERY_ORDEN = "orden";
const QUERY_DIR = "dir";
const QUERY_RESERVADAS = [QUERY_Q, QUERY_PAG, QUERY_ORDEN, QUERY_DIR];

/**
 * Composable que maneja filtrado local y paginación para tablas.
 *
 * @param {import("vue").Ref<Array>} dataRef - Ref reactiva con los datos originales
 * @param {Object} options
 * @param {number} [options.pageSize=10] - Cantidad inicial de items por página
 * @param {Function} [options.filterFn] - Función custom de filtrado (item, searchText) => boolean
 * @param {boolean|Object} [options.syncUrl=false] - Sincroniza búsqueda, filtros,
 *   página y orden con el query string. Acepta `true` (usa useRoute/useRouter del
 *   setup) o `{ route, router, debounce }` explícitos (útil en tests).
 * @param {number} [options.syncDebounce=300] - Espera en ms antes de escribir la URL
 * @param {string} [options.modo="local"] - "local" filtra/pagina en memoria;
 *   "servidor" delega en `cargarPagina` y expone `recargar`.
 * @param {Function} [options.cargarPagina] - En modo servidor:
 *   `async ({ page, limit, q, sort, order, filtros }) => ({ data, total })`.
 * @param {number} [options.recargaDebounce=250] - Debounce de recarga ante búsqueda
 */
export function useTableControls(dataRef, options = {}) {
    const { pageSize: defaultPageSize = 10 } = options;

    // ── Búsqueda ──────────────────────────────────────────────────────────
    const searchText = ref("");

    // ── Paginación ────────────────────────────────────────────────────────
    const currentPage = ref(1);
    const pageSize = ref(defaultPageSize);

    // ── Ordenamiento por columna ─────────────────────────────────────────
    const sortKey = ref(null);
    const sortDir = ref("asc"); // 'asc' | 'desc'

    /**
     * Alterna el orden de una columna. Tres estados: asc → desc → sin orden.
     * @param {string} key - Campo por el que ordenar
     * @param {Function} [getterFn] - Getter opcional (item) => valor comparable
     */
    function toggleSort(key, getterFn = null) {
        if (sortKey.value !== key) {
            sortKey.value = key;
            sortDir.value = "asc";
        } else if (sortDir.value === "asc") {
            sortDir.value = "desc";
        } else {
            sortKey.value = null;
            sortDir.value = "asc";
        }
        sortGetter.value = getterFn;
        currentPage.value = 1;
    }

    const sortGetter = ref(null);

    function compararValores(a, b) {
        // Números primero, luego strings con localeCompare
        const ambosNumericos =
            typeof a === "number" &&
            typeof b === "number";
        if (ambosNumericos) return a - b;
        return String(a ?? "").localeCompare(String(b ?? ""), "es", {
            numeric: true,
            sensitivity: "base",
        });
    }

    // ── Filtros por campo ─────────────────────────────────────────────────
    // Ej: { estado: 'activo', id_curso: '3' }
    const filters = ref({});

    /**
     * Cambia un filtro. Si value es '' o null, lo elimina.
     */
    function setFilter(key, value) {
        if (value === "" || value === null || value === undefined) {
            delete filters.value[key];
        } else {
            filters.value[key] = value;
        }
        filters.value = { ...filters.value }; // Trigger reactividad
        currentPage.value = 1;
    }

    /**
     * Limpia todos los filtros y la búsqueda.
     */
    function clearFilters() {
        searchText.value = "";
        filters.value = {};
        currentPage.value = 1;
    }

    // ── Modo servidor (C2): paginación/búsqueda/orden en el backend ─────────
    const esServidor = options.modo === "servidor";
    const filasServidor = ref([]);
    const totalServidor = ref(0);
    const recargaDebounce = options.recargaDebounce ?? 250;
    let temporizadorRecarga = null;

    async function recargar() {
        if (!esServidor || typeof options.cargarPagina !== "function") return;
        try {
            const resultado = await options.cargarPagina({
                page: currentPage.value,
                limit: pageSize.value,
                q: searchText.value.trim(),
                sort: sortKey.value,
                order: sortDir.value,
                filtros: { ...filters.value },
            });
            filasServidor.value = resultado?.data || [];
            totalServidor.value = resultado?.total ?? filasServidor.value.length;
        } catch {
            filasServidor.value = [];
            totalServidor.value = 0;
        }
    }

    function recargarDebounced() {
        clearTimeout(temporizadorRecarga);
        temporizadorRecarga = setTimeout(recargar, recargaDebounce);
    }

    // ── Datos filtrados ───────────────────────────────────────────────────
    const filteredData = computed(() => {
        if (esServidor) return filasServidor.value;
        let list = dataRef.value || [];

        // Búsqueda textual general (+ filtro custom aplicado siempre que exista,
        // incluso sin texto de búsqueda, para soportar visibilidad condicional)
        if (searchText.value.trim() || options.filterFn) {
            const q = searchText.value.toLowerCase().trim();
            list = list.filter((item) => {
                // Si hay una función custom, la usa
                if (options.filterFn) {
                    return options.filterFn(item, q);
                }
                // Por defecto busca en todas las propiedades string
                return Object.values(item).some((val) => {
                    if (val === null || val === undefined) return false;
                    return String(val).toLowerCase().includes(q);
                });
            });
        }

        // Filtros específicos por campo
        const activeFilters = Object.entries(filters.value);
        if (activeFilters.length > 0) {
            list = list.filter((item) => {
                return activeFilters.every(([key, value]) => {
                    const itemVal = item[key];
                    if (itemVal === null || itemVal === undefined) return false;
                    return String(itemVal).toLowerCase() === String(value).toLowerCase();
                });
            });
        }

        // Ordenamiento por columna activa
        if (sortKey.value) {
            const getter = sortGetter.value;
            const dir = sortDir.value === "asc" ? 1 : -1;
            list = [...list].sort((a, b) => {
                const va = getter ? getter(a) : a?.[sortKey.value];
                const vb = getter ? getter(b) : b?.[sortKey.value];
                return compararValores(va, vb) * dir;
            });
        }

        return list;
    });

    // ── Datos paginados ───────────────────────────────────────────────────
    const totalItems = computed(() =>
        esServidor ? totalServidor.value : filteredData.value.length,
    );

    const totalPages = computed(() =>
        Math.max(1, Math.ceil(totalItems.value / pageSize.value)),
    );

    const paginatedData = computed(() => {
        if (esServidor) return filasServidor.value;
        const start = (currentPage.value - 1) * pageSize.value;
        return filteredData.value.slice(start, start + pageSize.value);
    });

    if (esServidor) {
        // Cambios de página/orden/filtros recargan directo; la búsqueda con
        // debounce. Los setters ya resetean currentPage (una sola recarga por
        // tick gracias al batching de Vue).
        watch([currentPage, sortKey, sortDir, pageSize, filters], recargar, {
            deep: true,
        });
        watch(searchText, recargarDebounced);
        recargar();
    }

    // ── Cambio de página ──────────────────────────────────────────────────
    function goToPage(page) {
        if (page < 1 || page > totalPages.value) return;
        currentPage.value = page;
    }

    function setPageSize(size) {
        pageSize.value = size;
        currentPage.value = 1;
    }

    // Reiniciar página cuando cambian los filtros
    function onFilterChange() {
        currentPage.value = 1;
    }

    // ── Utils para obtener opciones de filtro únicas ──────────────────────
    function getUniqueOptions(field) {
        const list = dataRef.value || [];
        const values = new Set();
        list.forEach((item) => {
            const val = item[field];
            if (val !== null && val !== undefined && val !== "") {
                values.add(val);
            }
        });
        return Array.from(values).sort();
    }

    // ── Sincronización con la URL (Q5) ────────────────────────────────────
    // Lee ?q=, ?pag=, ?orden=, ?dir= y cualquier otro parámetro como filtro
    // por campo; escribe de vuelta con router.replace debounced.
    const syncOpts = options.syncUrl === true ? {} : options.syncUrl || null;
    if (syncOpts) {
        const ruta = syncOpts.route || useRoute();
        const navegador = syncOpts.router || useRouter();
        const espera = syncOpts.debounce ?? options.syncDebounce ?? 300;

        const leerQuery = () => ruta.query ?? ruta.value?.query ?? {};

        // Hidratación inicial desde la URL (no dispara escritura: el watch
        // no es immediate).
        const inicial = leerQuery();
        if (typeof inicial[QUERY_Q] === "string" && inicial[QUERY_Q]) {
            searchText.value = inicial[QUERY_Q];
        }
        const paginaInicial = parseInt(inicial[QUERY_PAG], 10);
        if (Number.isFinite(paginaInicial) && paginaInicial >= 1) {
            currentPage.value = paginaInicial;
        }
        if (typeof inicial[QUERY_ORDEN] === "string" && inicial[QUERY_ORDEN]) {
            sortKey.value = inicial[QUERY_ORDEN];
        }
        if (inicial[QUERY_DIR] === "asc" || inicial[QUERY_DIR] === "desc") {
            sortDir.value = inicial[QUERY_DIR];
        }
        const filtrosIniciales = {};
        for (const [clave, valor] of Object.entries(inicial)) {
            if (QUERY_RESERVADAS.includes(clave)) continue;
            if (valor === "" || valor === undefined || valor === null) continue;
            filtrosIniciales[clave] = Array.isArray(valor) ? valor[0] : valor;
        }
        filters.value = filtrosIniciales;

        let temporizador = null;
        const escribirUrl = () => {
            const query = {};
            if (searchText.value.trim()) query[QUERY_Q] = searchText.value.trim();
            if (currentPage.value > 1) query[QUERY_PAG] = String(currentPage.value);
            if (sortKey.value) {
                query[QUERY_ORDEN] = sortKey.value;
                query[QUERY_DIR] = sortDir.value;
            }
            for (const [clave, valor] of Object.entries(filters.value)) {
                if (valor === "" || valor === null || valor === undefined) continue;
                query[clave] = String(valor);
            }
            Promise.resolve(navegador.replace({ query })).catch(() => {});
        };
        watch(
            [searchText, currentPage, sortKey, sortDir, filters],
            () => {
                clearTimeout(temporizador);
                temporizador = setTimeout(escribirUrl, espera);
            },
            { deep: true },
        );
    }

    return {
        // Estado
        searchText,
        currentPage,
        pageSize,
        filters,
        sortKey,
        sortDir,
        // Datos
        filteredData,
        paginatedData,
        totalItems,
        totalPages,
        // Métodos
        setFilter,
        clearFilters,
        goToPage,
        setPageSize,
        onFilterChange,
        getUniqueOptions,
        toggleSort,
        recargar,
        esServidor,
    };
}
