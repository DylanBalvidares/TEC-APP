<template>
  <main class="main-content">

    <!-- Header -->
    <div class="news-header-box">
      <div class="news-header-icon">
        <img src="/noticias-header.png" alt="Noticias" />
      </div>
      <div class="news-header-text">
        <h1>Noticias y Comunicados</h1>
        <p>Mantente informado sobre lo que sucede en la Técnica 2</p>
        <div class="news-line"></div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-tabs">
        <button
          v-for="cat in categoriasFiltro"
          :key="cat"
          class="filter-btn"
          :class="{ active: filtroCategoria === cat }"
          @click="cambiarFiltro(cat)"
        >
          {{ cat }}
        </button>
      </div>
      <select class="sort-select" v-model="ordenarPor">
        <option value="recientes">Más recientes</option>
        <option value="antiguos">Más antiguos</option>
      </select>
    </div>

    <!-- Formulario nueva noticia (solo admins/profesores) -->
    <div class="crear-noticia" v-if="puedeCrear">
      <h3>Nueva publicación</h3>
      <div v-if="errorNoticia" class="feedback-msg error-msg"><i class="ti ti-alert-circle"></i> {{ errorNoticia }}</div>
      <div v-if="exitoNoticia" class="feedback-msg success-msg"><i class="ti ti-check"></i> {{ exitoNoticia }}</div>
      <input type="text" v-model="nuevaNoticia.titulo" placeholder="Título" />
      <textarea v-model="nuevaNoticia.descripcion" rows="4" placeholder="Escriba la noticia"></textarea>
      <select v-model="nuevaNoticia.categoria">
        <option value="Anuncios">Anuncios</option>
        <option value="Comunicados">Comunicados</option>
      </select>
      <button @click="crearNoticia" :disabled="creandoNoticia">
        <i class="ti ti-loader animate-spin" v-if="creandoNoticia"></i>
        {{ creandoNoticia ? "Publicando..." : "Publicar" }}
      </button>
    </div>

    <!-- Lista de noticias -->
    <div class="news-list" v-if="noticiasPaginadas.length > 0">
      <article v-for="(noticia, index) in noticiasPaginadas" :key="index" class="news-card">
        <div class="news-card-content">
          <span class="badge" :class="'badge-' + noticia.categoria.toLowerCase()">
            {{ noticia.categoria }}
          </span>
          <h3 class="news-card-title">{{ noticia.titulo }}</h3>
          <p class="news-card-description">{{ noticia.descripcion }}</p>
          <div class="news-card-meta">
            <span><i class="far fa-calendar"></i> {{ formatearFecha(noticia.fecha) }}</span>
            <span>•</span>
            <span><i class="fas fa-user"></i> {{ noticia.autor }}</span>
          </div>
          <div class="card-actions" v-if="puedeCrear">
            <button class="loan-btn" @click="abrirEditar(noticia)"><i class="fas fa-pencil-alt"></i> Editar</button>
            <button class="loan-btn btn-delete" @click="pedirEliminar(noticia)"><i class="fas fa-trash"></i> Eliminar</button>
          </div>
        </div>
      </article>
    </div>

    <!-- Estado vacío -->
    <div class="empty-state" v-else>
      <i class="fas fa-newspaper"></i>
      <p>No hay noticias disponibles en esta categoría.</p>
    </div>

    <!-- Paginación -->
    <div class="pagination-container" v-if="totalPaginas > 1">
      <div>Página {{ paginaActual }} de {{ totalPaginas }}</div>
      <ul class="pagination-list">
        <li class="pagination-item" @click="cambiarPagina(paginaActual - 1)">
          <i class="fas fa-chevron-left"></i>
        </li>
        <li
          v-for="p in totalPaginas"
          :key="p"
          class="pagination-item"
          :class="{ active: paginaActual === p }"
          @click="cambiarPagina(p)"
        >{{ p }}</li>
        <li class="pagination-item" @click="cambiarPagina(paginaActual + 1)">
          <i class="fas fa-chevron-right"></i>
        </li>
      </ul>
    </div>

    <!-- Modal Editar Noticia -->
    <Modal v-model="editarModalAbierto" title="Editar noticia">
      <div class="modal-form">
        <div v-if="errorNoticia" class="feedback-msg error-msg"><i class="ti ti-alert-circle"></i> {{ errorNoticia }}</div>
        <div class="modal-field">
          <label>Título</label>
          <input type="text" v-model="editTitulo" class="modal-input" />
        </div>
        <div class="modal-field">
          <label>Descripción</label>
          <textarea v-model="editDesc" rows="4" class="modal-input"></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel-modal" @click="editarModalAbierto = false">Cancelar</button>
        <button class="btn-save-modal" @click="confirmarEditar">Guardar</button>
      </template>
    </Modal>

    <!-- Modal Confirmar Eliminar -->
    <Modal v-model="eliminarModalAbierto" title="Eliminar noticia">
      <div v-if="errorEliminar" class="feedback-msg error-msg" style="margin-bottom: 12px;"><i class="ti ti-alert-circle"></i> {{ errorEliminar }}</div>
      <p>¿Estás seguro de que querés eliminar <strong>"{{ noticiaAEliminar?.titulo }}"</strong>?</p>
      <template #footer>
        <button class="btn-cancel-modal" @click="eliminarModalAbierto = false">Cancelar</button>
        <button class="btn-delete-modal" @click="confirmarEliminar" :disabled="eliminandoNoticia">
          <i class="ti ti-loader animate-spin" v-if="eliminandoNoticia"></i>
          {{ eliminandoNoticia ? "Eliminando..." : "Eliminar" }}
        </button>
      </template>
    </Modal>

  </main>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth.js";
import { obtenerNoticias, crearNoticia as crearNoticiaApi, actualizarNoticia, eliminarNoticia as eliminarNoticiaApi, obtenerTodosComunicados } from "@/services/comunidad-service.js";
import Modal from "@/components/ui/Modal.vue";

const authStore = useAuthStore();
// Permitir crear noticias si es root, podes ajustarlo según tu backend
const puedeCrear = computed(() => ["root", "profesor"].includes(authStore.rol));

const filtroCategoria = ref("Todas");
const ordenarPor = ref("recientes");
const paginaActual = ref(1);
const noticiasPorPagina = 5;

const categoriasFiltro = ["Todas", "Anuncios", "Comunicados"];

const nuevaNoticia = ref({
  titulo: "",
  descripcion: "",
  categoria: "Anuncios",
});

const noticias = ref([]);

// ── Estado de modales y feedback ──────────────────────────────────────────────
const editarModalAbierto = ref(false);
const eliminarModalAbierto = ref(false);
const noticiaAEliminar = ref(null);
const noticiaEditando = ref(null);
const editTitulo = ref("");
const editDesc = ref("");
const creandoNoticia = ref(false);
const eliminandoNoticia = ref(false);
const errorNoticia = ref("");
const errorEliminar = ref("");
const exitoNoticia = ref("");

const cargarNoticias = async () => {
  try {
    const dataNoticias = await obtenerNoticias();
    let combinadas = [];
    if (dataNoticias && dataNoticias.length > 0) {
      combinadas = dataNoticias.map((n) => ({
        id: n.id_noticia,
        titulo: n.titulo,
        descripcion: n.contenido,
        categoria: n.categoria || "Anuncios",
        autor: n.autor || "Equipo Directivo",
        fecha: new Date(n.fecha),
        esComunicado: false,
      }));
    }

    try {
      let cursoAlumno = null;
      try {
        const alumnoRaw = localStorage.getItem("alumno");
        if (alumnoRaw) {
          const alumno = JSON.parse(alumnoRaw);
          cursoAlumno = alumno.curso?.nombre_curso || alumno.data?.curso?.nombre_curso;
        }
      } catch (e) {}

      const comunicadosRes = await obtenerTodosComunicados({ rol: "alumno", curso: cursoAlumno || "" });
      if (comunicadosRes.success && comunicadosRes.data && comunicadosRes.data.length > 0) {
        const comunicadosMapped = comunicadosRes.data.map(c => ({
          id: c.id_comunicado,
          titulo: c.titulo,
          descripcion: c.mensaje,
          categoria: "Comunicados",
          autor: c.autor_id ? "Profesor/Autoridad" : "Sistema",
          fecha: new Date(c.fecha_publicacion),
          esComunicado: true,
        }));
        combinadas = combinadas.concat(comunicadosMapped);
      }
    } catch (e) {
      console.error("Error al cargar comunicados:", e);
    }

    noticias.value = combinadas;
  } catch (error) {
    console.error("Error al cargar noticias:", error);
    noticias.value = [];
  }
};

onMounted(cargarNoticias);

const limpiarFeedback = () => {
  errorNoticia.value = "";
  exitoNoticia.value = "";
};

const crearNoticia = async () => {
  limpiarFeedback();
  if (!nuevaNoticia.value.titulo.trim() || !nuevaNoticia.value.descripcion.trim()) {
    errorNoticia.value = "Completá todos los campos obligatorios.";
    return;
  }

  creandoNoticia.value = true;
  try {
    const payload = {
      titulo: nuevaNoticia.value.titulo.trim(),
      contenido: nuevaNoticia.value.descripcion.trim(),
      autor_id: authStore.usuario?.id || 1,
      categoria: nuevaNoticia.value.categoria,
    };
    const res = await crearNoticiaApi(payload);
    if (res && !res.success) {
      errorNoticia.value = res.message || "Error al publicar.";
      return;
    }
    nuevaNoticia.value = { titulo: "", descripcion: "", categoria: "Anuncios" };
    exitoNoticia.value = "Noticia publicada correctamente.";
    paginaActual.value = 1;
    await cargarNoticias();
  } catch (error) {
    errorNoticia.value = "Error al publicar la noticia en el servidor.";
  } finally {
    creandoNoticia.value = false;
  }
};

const abrirEditar = (noticia) => {
  errorNoticia.value = "";
  noticiaEditando.value = noticia;
  editTitulo.value = noticia.titulo;
  editDesc.value = noticia.descripcion;
  editarModalAbierto.value = true;
};

const confirmarEditar = async () => {
  if (!noticiaEditando.value) return;
  try {
    const payload = {
      titulo: editTitulo.value.trim(),
      contenido: editDesc.value.trim(),
    };
    const res = await actualizarNoticia(noticiaEditando.value.id, payload);
    if (res && !res.success) {
      errorNoticia.value = res.message || "Error al actualizar.";
      return;
    }
    editarModalAbierto.value = false;
    noticiaEditando.value = null;
    await cargarNoticias();
  } catch (error) {
    errorNoticia.value = "Error al actualizar la noticia.";
  }
};

const pedirEliminar = (noticia) => {
  noticiaAEliminar.value = noticia;
  eliminarModalAbierto.value = true;
};

const confirmarEliminar = async () => {
  eliminandoNoticia.value = true;
  errorEliminar.value = "";
  try {
    const res = await eliminarNoticiaApi(noticiaAEliminar.value.id);
    if (res && !res.success) {
      errorEliminar.value = res.message || "Error al eliminar.";
      return;
    }
    eliminarModalAbierto.value = false;
    noticiaAEliminar.value = null;
    await cargarNoticias();
  } catch (error) {
    errorEliminar.value = "Error al eliminar la noticia.";
  } finally {
    eliminandoNoticia.value = false;
  }
};

const noticiasFiltradasYOrdenadas = computed(() => {
  let resultado =
    filtroCategoria.value !== "Todas" ? noticias.value.filter((n) => n.categoria === filtroCategoria.value) : [...noticias.value];
  return resultado.sort((a, b) => (ordenarPor.value === "recientes" ? b.fecha - a.fecha : a.fecha - b.fecha));
});

const noticiasPaginadas = computed(() =>
  noticiasFiltradasYOrdenadas.value.slice((paginaActual.value - 1) * noticiasPorPagina, paginaActual.value * noticiasPorPagina),
);
const totalPaginas = computed(() => Math.ceil(noticiasFiltradasYOrdenadas.value.length / noticiasPorPagina));

const cambiarFiltro = (cat) => {
  filtroCategoria.value = cat;
  paginaActual.value = 1;
};
const cambiarPagina = (p) => {
  if (p >= 1 && p <= totalPaginas.value) paginaActual.value = p;
};

const formatearFecha = (fecha) =>
  fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
</script>


<style scoped>
.main-content {
  flex: 1;
  padding: 28px 32px;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
}

/* ── Header ───────────────────────────────── */
.news-header-box {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, #fff 0%, #fdf8f8 100%);
  padding: 22px 28px;
  border-radius: 20px;
  border: 1px solid #f0e8e8;
  box-shadow: 0 4px 14px rgba(192, 21, 42, 0.04);
}

.news-header-icon img {
  width: 90px;
  height: 90px;
  object-fit: contain;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.08));
}

.news-header-text h1 {
  font-size: 1.6rem;
  color: #0f172a;
  margin: 0 0 4px 0;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.news-header-text p {
  color: #64748b;
  font-size: 0.92rem;
  margin: 0;
}

.news-line {
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #c0152a, #ef4444);
  border-radius: 10px;
  margin-top: 10px;
}

/* ── Filter Bar ───────────────────────────── */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background: #fff;
  padding: 10px 16px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  border: 1px solid #e8edf2;
}

.filter-tabs { display: flex; flex-wrap: wrap; gap: 6px; }

.filter-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 7px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
}

.filter-btn:hover { background: #f1f5f9; }

.filter-btn.active {
  background: rgba(192, 21, 42, 0.08);
  border-color: rgba(192, 21, 42, 0.25);
  color: #c0152a;
  font-weight: 700;
}

.sort-select {
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  outline: none;
  font-size: 0.85rem;
  color: #475569;
  background: #fff;
  cursor: pointer;
}

/* ── Formulario Nueva Noticia ─────────────── */
.crear-noticia {
  background: #fff;
  padding: 20px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  border: 1px solid #e8edf2;
}

.crear-noticia h3 { margin: 0 0 4px 0; font-size: 1rem; color: #0f172a; }

.crear-noticia input,
.crear-noticia textarea,
.crear-noticia select {
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  background: #f8fafc;
  transition: all 0.2s;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.crear-noticia input:focus,
.crear-noticia textarea:focus,
.crear-noticia select:focus {
  border-color: #c0152a;
  box-shadow: 0 0 0 3px rgba(192, 21, 42, 0.1);
  outline: none;
}

.crear-noticia button,
.loan-btn {
  background: linear-gradient(135deg, #c0152a, #a81124);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 4px 10px rgba(192, 21, 42, 0.2);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.crear-noticia button:hover, .loan-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(192, 21, 42, 0.28);
}

.btn-delete {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  box-shadow: 0 4px 10px rgba(220, 38, 38, 0.2);
}

/* ── News List ────────────────────────────── */
.news-list { display: flex; flex-direction: column; gap: 14px; }

.news-card {
  display: flex;
  background: #fff;
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  align-items: flex-start;
  gap: 16px;
  border: 1px solid #e8edf2;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  overflow: hidden;        /* evita que el contenido se desborde */
}

.news-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.09);
}

.news-card-content {
  flex: 1;
  min-width: 0;            /* fundamental para que flex no ignore el overflow */
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.badge-anuncios    { background: #fee2e2; color: #dc2626; }
.badge-comunicados { background: #dcfce7; color: #16a34a; }

.news-card-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #0f172a;
  line-height: 1.35;
  /* Truncar a 2 líneas */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card-description {
  color: #475569;
  font-size: 0.88rem;
  line-height: 1.6;
  margin: 0 0 12px 0;
  /* Contener el texto dentro del card */
  overflow-wrap: break-word;
  word-break: break-word;
  /* Limitar a 3 líneas */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card-meta {
  display: flex;
  gap: 10px;
  color: #94a3b8;
  font-size: 0.78rem;
  flex-wrap: wrap;
}

.card-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.news-card-arrow {
  color: #c0d0e0;
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 4px;
  transition: color 0.2s, transform 0.2s;
}

.news-card:hover .news-card-arrow {
  color: #c0152a;
  transform: translateX(3px);
}

/* ── Feedback messages ────────────────────── */
.feedback-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
}
.error-msg {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}
.success-msg {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}

/* ── Modal buttons ─────────────────────────── */
.btn-cancel-modal {
  background: white;
  border: 1px solid #d1d5db;
  color: #4b5563;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel-modal:hover {
  background: #f9fafb;
}
.btn-save-modal {
  background: #c0152a;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-save-modal:hover {
  background: #a81124;
}
.btn-delete-modal {
  background: #dc2626;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-delete-modal:hover {
  background: #b91c1c;
}
.btn-delete-modal:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.modal-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.modal-field label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #374151;
}
.modal-input {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.modal-input:focus {
  border-color: #c0152a;
  box-shadow: 0 0 0 3px rgba(192, 21, 42, 0.1);
}
.modal-input textarea {
  resize: vertical;
}

/* ── Empty State ──────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 0;
  color: #94a3b8;
  gap: 14px;
  background: #fff;
  border-radius: 18px;
  border: 1px dashed #e2e8f0;
}

.empty-state i { font-size: 2.5rem; opacity: 0.5; }
.empty-state p { font-size: 1rem; margin: 0; }

/* ── Pagination ───────────────────────────── */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #64748b;
  font-size: 0.88rem;
}

.pagination-list { display: flex; list-style: none; gap: 4px; padding: 0; margin: 0; }

.pagination-item {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  font-size: 0.88rem;
  font-weight: 600;
}

.pagination-item:hover { background: #f8fafc; border-color: #e2e8f0; }

.pagination-item.active {
  border-color: #c0152a;
  color: #c0152a;
  font-weight: 800;
  background: rgba(192, 21, 42, 0.05);
}

/* ── Responsive ───────────────────────────── */
@media (max-width: 600px) {
  .main-content { padding: 16px; }
  .news-card { flex-direction: column; }
  .news-header-icon img { width: 64px; height: 64px; }
  .news-header-text h1 { font-size: 1.3rem; }
}
</style>
