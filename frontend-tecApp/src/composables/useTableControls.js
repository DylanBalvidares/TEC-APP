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

        // Búsqueda textual general
        if (searchText.value.trim()) {
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
    };
}
