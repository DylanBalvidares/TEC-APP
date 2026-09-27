import { ref, computed } from "vue";

/**
 * Composable que maneja filtrado local y paginación para tablas.
 *
 * @param {import("vue").Ref<Array>} dataRef - Ref reactiva con los datos originales
 * @param {Object} options
 * @param {number} [options.pageSize=10] - Cantidad inicial de items por página
 * @param {Function} [options.filterFn] - Función custom de filtrado (item, searchText) => boolean
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

    // ── Datos filtrados ───────────────────────────────────────────────────
    const filteredData = computed(() => {
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
    const totalItems = computed(() => filteredData.value.length);

    const totalPages = computed(() =>
        Math.max(1, Math.ceil(totalItems.value / pageSize.value)),
    );

    const paginatedData = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value;
        return filteredData.value.slice(start, start + pageSize.value);
    });

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
    };
}
