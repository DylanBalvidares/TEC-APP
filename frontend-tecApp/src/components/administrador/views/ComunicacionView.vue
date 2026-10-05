<template>
    <div class="comunicacion-wrapper">
        <div class="tabs-nav" role="tablist" aria-label="Comunicación">
            <button
                v-for="t in TABS"
                :key="t.clave"
                role="tab"
                :aria-selected="tabActiva === t.clave"
                :class="['tab-btn', { active: tabActiva === t.clave }]"
                @click="irTab(t.clave)"
            >
                <i :class="['ti', t.icono]" aria-hidden="true"></i>
                {{ t.nombre }}
            </button>
        </div>

        <div class="tab-panel">
            <!-- v-show va en el div nativo: la directiva no funciona sobre
                 componentes con raíz fragmento. -->
            <div v-show="tabActiva === 'noticias'">
                <NoticiasView />
            </div>
            <div v-show="tabActiva === 'comunicados'">
                <ComunicadosView />
            </div>
            <div v-show="tabActiva === 'mensajes'">
                <MensajesView />
            </div>
            <div v-show="tabActiva === 'emails'">
                <MonitorCorreos />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useComunicacionStore } from "../../../stores/comunicacion.js";
import NoticiasView from "./NoticiasView.vue";
import ComunicadosView from "./ComunicadosView.vue";
import MensajesView from "./MensajesView.vue";
import MonitorCorreos from "./MonitorCorreos.vue";

defineOptions({ name: "ComunicacionView" });

const TABS = [
    { clave: "noticias", nombre: "Noticias", icono: "ti-news" },
    { clave: "comunicados", nombre: "Comunicados", icono: "ti-speakerphone" },
    { clave: "mensajes", nombre: "WhatsApp", icono: "ti-brand-whatsapp" },
    { clave: "emails", nombre: "Emails", icono: "ti-mail" },
];
const CLAVES_VALIDAS = TABS.map((t) => t.clave);

const route = useRoute();
const router = useRouter();
const comunicacion = useComunicacionStore();

const tabDesdeUrl = () => {
    // Prioridad al pedido externo (Overview/cambiar-vista), que puede llegar
    // antes de que el query se actualice; si no, URL; si no, Noticias.
    const pendiente = comunicacion.consumirTabPendiente();
    if (pendiente) return pendiente;
    return CLAVES_VALIDAS.includes(route.query.tab) ? route.query.tab : "noticias";
};

const tabActiva = ref(tabDesdeUrl());

const sincronizarUrl = () => {
    // Escritura explícita (sin spread de route.query): este contenedor solo
    // vive bajo vista=comunicacion, y el spread competía con el replace del
    // Dashboard (watch currentView), borrando `vista` de la URL.
    if (route.query.vista === "comunicacion" && route.query.tab === tabActiva.value) return;
    router.replace({ query: { vista: "comunicacion", tab: tabActiva.value } });
};

const irTab = (clave) => {
    if (!CLAVES_VALIDAS.includes(clave)) return;
    tabActiva.value = clave;
    sincronizarUrl();
};

watch(tabActiva, sincronizarUrl);

// Atrás/adelante del navegador.
watch(
    () => route.query.tab,
    (tab) => {
        if (CLAVES_VALIDAS.includes(tab) && tab !== tabActiva.value) {
            tabActiva.value = tab;
        }
    },
);

onMounted(() => {
    sincronizarUrl();
});
</script>

<style scoped>
.comunicacion-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.tabs-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 10px;
    padding: 8px 14px;
    font-weight: 600;
    font-size: 14px;
    color: #4b5563;
    cursor: pointer;
}
.tab-btn:hover {
    border-color: #cd322c;
    color: #cd322c;
}
.tab-btn.active {
    background: #cd322c;
    border-color: #cd322c;
    color: #fff;
}
.tab-panel {
    min-height: 200px;
}
</style>
