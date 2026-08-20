<template>
    <div v-if="totalPages > 1" class="pagination-wrapper">
        <div class="pagination-info">
            Mostrando
            <strong>{{ startItem }}-{{ endItem }}</strong> de
            <strong>{{ totalItems }}</strong>
        </div>

        <div class="pagination-controls">
            <button
                class="page-btn"
                :disabled="currentPage <= 1"
                @click="goToPage(currentPage - 1)"
                aria-label="Página anterior"
                title="Anterior"
            >
                <i class="ti ti-chevron-left"></i>
            </button>

            <button
                v-for="page in visiblePages"
                :key="page"
                class="page-btn"
                :class="{ active: page === currentPage }"
                @click="goToPage(page)"
                :aria-label="`Ir a página ${page}`"
                :aria-current="page === currentPage ? 'page' : undefined"
            >
                {{ page }}
            </button>

            <button
                class="page-btn"
                :disabled="currentPage >= totalPages"
                @click="goToPage(currentPage + 1)"
                aria-label="Página siguiente"
                title="Siguiente"
            >
                <i class="ti ti-chevron-right"></i>
            </button>
        </div>

        <div class="pagination-size">
            <select v-model="pageSize" @change="onPageSizeChange" aria-label="Filas por página">
                <option v-for="size in pageSizes" :key="size" :value="size">
                    {{ size }} / pág
                </option>
            </select>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
    currentPage: { type: Number, required: true },
    totalItems: { type: Number, required: true },
    pageSize: { type: Number, default: 10 },
    pageSizes: { type: Array, default: () => [10, 25, 50, 100] },
});

const emit = defineEmits(["page-change", "page-size-change"]);

const pageSize = ref(props.pageSize);

const totalPages = computed(() =>
    Math.max(1, Math.ceil(props.totalItems / pageSize.value)),
);

const startItem = computed(() =>
    props.totalItems === 0 ? 0 : (props.currentPage - 1) * pageSize.value + 1,
);

const endItem = computed(() =>
    Math.min(props.currentPage * pageSize.value, props.totalItems),
);

const visiblePages = computed(() => {
    const pages = [];
    const total = totalPages.value;
    const current = props.currentPage;

    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
        return pages;
    }

    pages.push(1);
    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push("...");
    pages.push(total);

    return pages;
});

function goToPage(page) {
    if (page < 1 || page > totalPages.value) return;
    emit("page-change", page);
}

function onPageSizeChange() {
    emit("page-size-change", Number(pageSize.value));
}

watch(
    () => props.pageSize,
    (val) => {
        pageSize.value = val;
    },
);
</script>

<style scoped>
.pagination-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    gap: 16px;
    flex-wrap: wrap;
}

.pagination-info {
    font-size: 12px;
    color: #6b7280;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 2px;
}

.page-btn {
    min-width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #4b5563;
    font-size: 12.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s;
    padding: 0 6px;
}

.page-btn:hover:not(:disabled):not(.active) {
    background: #f3f4f6;
    border-color: #d1d5db;
}

.page-btn.active {
    background: #cd322c;
    color: white;
    border-color: #cd322c;
}

.page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.pagination-size select {
    padding: 4px 8px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    color: #4b5563;
    background: white;
    cursor: pointer;
    outline: none;
}

.pagination-size select:focus {
    border-color: #cd322c;
    box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.08);
}
</style>
