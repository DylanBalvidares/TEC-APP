<template>
    <section class="tab-panel active">
        <div class="tab-toolbar">
            <div class="tab-toolbar-left">
                <h2 class="section-title"><i class="fas fa-newspaper"></i> Noticias</h2>
            </div>
        </div>

        <div v-if="cargando" class="empty-state">
            <i class="fas fa-spinner fa-spin empty-icon"></i>
            <p>Cargando noticias...</p>
        </div>

        <div v-else class="noticias-grid">
            <Card v-for="n in noticias" :key="n.id_noticia" class="noticia-card-prof">
                <div class="noticia-horizontal">
                    <div class="noticia-content noticia-clickable" @click="openNews(n)">
                        <h3 class="noticia-titulo">{{ n.titulo }}</h3>
                        <p class="noticia-extracto">{{ n.contenido }}</p>
                        <div class="card-footer">
                            <span class="fecha-lbl">{{ formatDate(n.fecha) }}</span>
                            <button class="btn-cancel" @click.stop="openNews(n)" aria-label="Leer más">Leer más</button>
                        </div>
                    </div>

                    <div v-if="n.imagen_url" class="noticia-side">
                        <div :class="['noticia-image-wrap', { 'image-loading': !loadedImages[n.id_noticia] }]">
                            <img
                                :src="n.imagen_url"
                                :alt="n.titulo"
                                class="noticia-card-image"
                                loading="lazy"
                                decoding="async"
                                @load="marcarCargada(n.id_noticia)"
                            />
                        </div>
                    </div>
                </div>
            </Card>
            <div v-if="noticias.length === 0">
                <EmptyState icon="fas fa-newspaper">Aún no hay noticias disponibles.</EmptyState>
            </div>
        </div>

        <Modal v-model="showNews" :title="selectedNews?.titulo" wide>
            <div class="imagen-preview-container">
                <div v-if="selectedNews?.imagen_url" :class="['imagen-preview', { 'image-loading': !loadedImages[selectedNews.id_noticia] }]">
                    <img
                        :src="selectedNews.imagen_url"
                        :alt="selectedNews.titulo"
                        loading="lazy"
                        decoding="async"
                        @load="marcarCargada(selectedNews.id_noticia)"
                    />
                </div>
                <div v-else class="fallback-detail" style="padding:12px 0;">
                    <i class="fas fa-photo-video"></i>
                    <span style="margin-left:8px;color:var(--muted)">Sin imagen adjunta</span>
                </div>
            </div>
            <p class="noticia-cuerpo">{{ selectedNews?.contenido }}</p>
            <template #footer>
                <button class="btn-cancel" @click="closeNews()">Cerrar</button>
            </template>
        </Modal>
    </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import EmptyState from "../EmptyState.vue";
import { obtenerNoticias } from "@/services/comunidad-service.js";
import Modal from "@/components/ui/Modal.vue";
import Card from "@/components/ui/Card.vue";
import { formatDate } from "@/utils/formatters.js";

const noticias = ref([]);
const cargando = ref(true);
const showNews = ref(false);
const selectedNews = ref(null);

// track image load state to show LQIP / blur placeholder until loaded
const loadedImages = ref({});
const marcarCargada = (id) => {
    if (!id) return;
    loadedImages.value = { ...(loadedImages.value || {}), [id]: true };
};

const cargarNoticias = async () => {
    try {
        const data = await obtenerNoticias();
        if (data) {
            noticias.value = data;
        }
    } catch (error) {
        console.error("Error al obtener noticias:", error);
    } finally {
        cargando.value = false;
    }
};

const openNews = (n) => {
    selectedNews.value = n;
    showNews.value = true;
};

const closeNews = () => {
    selectedNews.value = null;
    showNews.value = false;
};

onMounted(cargarNoticias);

</script>

<style scoped src="../profesores.css"></style>
<style scoped>
.noticias-grid {
    display: grid;
    gap: 20px;
    margin-top: 16px;
}
.noticia-card-prof {
    background: var(--surface, #fff);
    border-radius: var(--radius-lg, 16px);
    border: 1px solid var(--line, #e5e7eb);
    padding: 20px;
    box-shadow: var(--elev-1, 0 6px 18px rgba(2,6,23,0.06));
    transition: transform 0.2s, box-shadow 0.2s;
}
.noticia-card-prof:hover {
    transform: translateY(-4px);
    box-shadow: var(--elev-2, 0 12px 40px rgba(2,6,23,0.10));
}
.noticia-horizontal {
    display: flex;
    gap: 24px;
    align-items: stretch;
}
.noticia-content {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 4px 0;
}
.noticia-clickable {
    cursor: pointer;
}
.noticia-titulo {
    margin: 0 0 10px 0;
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--text, #1f2937);
    transition: color 0.2s;
}
.noticia-card-prof:hover .noticia-titulo {
    color: var(--primary, #c0152a);
}
.noticia-extracto {
    margin: 0;
    color: var(--muted, #6b7280);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.5;
    font-size: 0.95rem;
}
.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
}
.fecha-lbl {
    font-size: 0.85rem;
    font-weight: 600;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 6px;
}
.fecha-lbl::before {
    content: "\f133";
    font-family: "Font Awesome 6 Free";
    font-weight: 400;
}
.btn-cancel {
    padding: 8px 16px;
    border-radius: var(--radius-sm, 10px);
    font-size: 0.85rem;
    font-weight: 600;
}
.noticia-side {
    width: 240px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
}
.noticia-image-wrap {
    width: 100%;
    height: 160px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
}
.noticia-card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}
.noticia-card-prof:hover .noticia-card-image {
    transform: scale(1.05);
}
.imagen-preview-container {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
}
.imagen-preview img {
    max-width: 100%;
    max-height: 400px;
    border-radius: 12px;
    object-fit: contain;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.noticia-cuerpo {
    white-space: pre-wrap;
    color: var(--text, #334155);
    line-height: 1.6;
    font-size: 1rem;
}

/* ── Override reglas conflictivas de profesores.css ── */
/* El ::after con gradiente oscuro sobre la imagen hace que se vea "rota" */
.noticia-card-prof .noticia-image-wrap::after {
    content: none !important;
}

/* profesores.css fuerza flex-direction:column que rompe el layout horizontal */
.noticia-card-prof {
    flex-direction: initial !important;
}

/* Asegurar altura correcta de la imagen (160px) vs 200px de profesores.css */
.noticia-card-prof .noticia-image-wrap {
    height: 160px;
}

/* Quitar el background de skeleton/loading que profesores.css aplica */
.noticia-card-prof .noticia-image-wrap {
    background: transparent;
}

@media (max-width: 720px) {
    .noticia-horizontal {
        flex-direction: column-reverse;
    }
    .noticia-side {
        width: 100%;
    }
    .noticia-image-wrap {
        height: 200px;
    }
}
</style>
