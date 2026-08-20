<template>
  <main class="main-content">
    <section class="title-section">
      <div class="caja"><img src="/cajita2.png" alt="caja" /></div>
      <div>
        <h1>Objetos Perdidos</h1>
        <p>Explora las categorías para encontrar objetos perdidos.</p>
      </div>
      <img src="/cosas.png" alt="Cosas" class="cosas-img" />
    </section>

    <!-- Categorías -->
    <section class="cards">
      <div
        class="card red"
        :class="{ 'card-active': filtroCategoria === 'Ropa' }"
        @click="filtrarPorCategoria('Ropa')"
      >
        <img src="/remera.png" alt="remera" />
        <div class="card-content">
          <h3>Ropa</h3>
          <p>Camperas, uniformes, bufandas...</p>
          <button class="btn-cat btn-cat-red">
            {{ filtroCategoria === 'Ropa' ? 'Mostrar todas' : 'Ver objetos' }}
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
      <div
        class="card yellow"
        :class="{ 'card-active': filtroCategoria === 'Útiles' }"
        @click="filtrarPorCategoria('Útiles')"
      >
        <img src="/lapiz.png" alt="lapiz" />
        <div class="card-content">
          <h3>Útiles</h3>
          <p>Cartucheras, libros, mochilas...</p>
          <button class="btn-cat btn-cat-yellow">
            {{ filtroCategoria === 'Útiles' ? 'Mostrar todas' : 'Ver objetos' }}
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
      <div
        class="card blue"
        :class="{ 'card-active': filtroCategoria === 'Dispositivos' }"
        @click="filtrarPorCategoria('Dispositivos')"
      >
        <img src="/celu.png" alt="celular" />
        <div class="card-content">
          <h3>Dispositivos</h3>
          <p>Calculadoras, celulares, tablets...</p>
          <button class="btn-cat btn-cat-blue">
            {{ filtroCategoria === 'Dispositivos' ? 'Mostrar todas' : 'Ver objetos' }}
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
      <div
        class="card green"
        :class="{ 'card-active': filtroCategoria === 'Otros' }"
        @click="filtrarPorCategoria('Otros')"
      >
        <img src="/llave.png" alt="llave" />
        <div class="card-content">
          <h3>Otros Objetos</h3>
          <p>Llaves, termos, lentes...</p>
          <button class="btn-cat btn-cat-green">
            {{ filtroCategoria === 'Otros' ? 'Mostrar todas' : 'Ver objetos' }}
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- Lista de objetos reportados (dinámica desde el backend) -->
    <section v-if="listaObjetos.length > 0" class="objetos-list">
      <div class="objetos-list-header">
        <h3>
          Objetos reportados
          <span v-if="filtroCategoria" class="badge-filtro">({{ filtroCategoria }})</span>
        </h3>
        <span class="objetos-count">{{ objetosFiltrados.length }} objeto{{ objetosFiltrados.length !== 1 ? 's' : '' }}</span>
      </div>
      <div v-if="objetosFiltrados.length > 0" class="objetos-grid">
        <div v-for="(obj, index) in objetosFiltrados" :key="obj.id_objeto || index" class="objeto-card">
          <div class="objeto-icon">
            <i class="fas fa-box"></i>
          </div>
          <div class="objeto-info">
            <h4>{{ obj.nombre }}</h4>
            <p>{{ obj.descripcion }}</p>
            <span class="objeto-categoria">{{ obj.categoria }}</span>
            <span class="objeto-fecha">{{ formatDate(obj.fecha_registro) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="objetos-empty">
        <p>No hay objetos en esta categoría.</p>
      </div>
    </section>

    <section class="help-box">
      <div>
        <h4>¿Perdiste algo?</h4>
        <p>Revisa las categorías o acércate a preceptoría para más ayuda.</p>
      </div>
      <button class="btn-reportar" @click="reportarModalAbierto = true">Reportar objeto perdido</button>
    </section>

    <!-- Modal Reportar Objeto -->
    <Modal v-model="reportarModalAbierto" title="Reportar objeto perdido">
      <div class="modal-form">
        <div v-if="errorReporte" class="feedback-msg error-msg"><i class="ti ti-alert-circle"></i> {{ errorReporte }}</div>
        <div v-if="exitoReporte" class="feedback-msg success-msg"><i class="ti ti-check"></i> {{ exitoReporte }}</div>
        <div class="modal-field">
          <label>Nombre del objeto <span class="required-field">*</span></label>
          <input type="text" v-model="reporteForm.nombre" class="modal-input" placeholder="Ej: Mochila azul" />
        </div>
        <div class="modal-field">
          <label>Descripción <span class="required-field">*</span></label>
          <textarea v-model="reporteForm.descripcion" rows="3" class="modal-input" placeholder="Color, marca, detalles..."></textarea>
        </div>
        <div class="modal-field">
          <label>Categoría <span class="required-field">*</span></label>
          <select v-model="reporteForm.categoria" class="modal-input">
            <option value="">Seleccionar categoría...</option>
            <option value="Ropa">Ropa</option>
            <option value="Útiles">Útiles</option>
            <option value="Dispositivos">Dispositivos</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel-modal" @click="cerrarReporte">Cancelar</button>
        <button class="btn-save-modal" @click="reportarNuevoObjeto" :disabled="reportando">
          <i class="ti ti-loader animate-spin" v-if="reportando"></i>
          {{ reportando ? "Reportando..." : "Reportar objeto" }}
        </button>
      </template>
    </Modal>
  </main>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { obtenerObjetosPerdidos, reportarObjetoPerdido } from "@/services/comunidad-service.js";
import { formatDate } from "@/utils/formatters.js";
import Modal from "@/components/ui/Modal.vue";

const listaObjetos = ref([]);
const filtroCategoria = ref("");

// ── Estado del modal ──────────────────────────────────────────────────────────
const reportarModalAbierto = ref(false);
const reportando = ref(false);
const errorReporte = ref("");
const exitoReporte = ref("");

const reporteForm = reactive({
  nombre: "",
  descripcion: "",
  categoria: "",
});

const objetosFiltrados = computed(() => {
  if (!filtroCategoria.value) return listaObjetos.value;
  return listaObjetos.value.filter(
    (o) => o.categoria?.toLowerCase() === filtroCategoria.value.toLowerCase()
  );
});

const filtrarPorCategoria = (cat) => {
  filtroCategoria.value = filtroCategoria.value === cat ? "" : cat;
};

const cerrarReporte = () => {
  reportarModalAbierto.value = false;
  errorReporte.value = "";
  exitoReporte.value = "";
  reporteForm.nombre = "";
  reporteForm.descripcion = "";
  reporteForm.categoria = "";
};

onMounted(async () => {
  try {
    const data = await obtenerObjetosPerdidos();
    if (data) {
      listaObjetos.value = data;
    }
  } catch (error) {
    console.error("Error al obtener objetos perdidos:", error);
  }
});

const reportarNuevoObjeto = async () => {
  errorReporte.value = "";
  exitoReporte.value = "";

  if (!reporteForm.nombre.trim() || !reporteForm.descripcion.trim() || !reporteForm.categoria) {
    errorReporte.value = "Completá todos los campos obligatorios.";
    return;
  }

  reportando.value = true;

  try {
    const res = await reportarObjetoPerdido({
      nombre: reporteForm.nombre.trim(),
      descripcion: reporteForm.descripcion.trim(),
      categoria: reporteForm.categoria,
      estado: "perdido",
      fecha_registro: new Date(),
    });
    if (res && !res.success) {
      errorReporte.value = res.message || "Error al reportar.";
      return;
    }
    exitoReporte.value = "Objeto reportado correctamente.";
    const data = await obtenerObjetosPerdidos();
    listaObjetos.value = data;
    setTimeout(cerrarReporte, 1200);
  } catch (error) {
    errorReporte.value = "Error al reportar objeto.";
  } finally {
    reportando.value = false;
  }
};
</script>

<style scoped>
.main-content {
  flex: 1;
  padding: 28px 32px;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Title Section ────────────────────────── */
.title-section {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #fdf8f8 100%);
  padding: 28px 36px;
  border-radius: 22px;
  border: 1px solid #f0e8e8;
  box-shadow: 0 6px 24px rgba(192, 21, 42, 0.04), 0 1px 4px rgba(15,23,42,0.04);
  position: relative;
  overflow: hidden;
}

.title-section::after {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(192,21,42,0.05) 0%, transparent 70%);
  pointer-events: none;
}

.title-section h1 {
  font-size: 2.2rem;
  margin-bottom: 6px;
  color: #0f172a;
  font-weight: 800;
  letter-spacing: -0.4px;
}

.title-section p {
  color: #64748b;
  font-size: 1rem;
}

.caja img {
  width: 72px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
}

.cosas-img {
  margin-left: auto;
  width: 180px;
  opacity: 0.85;
  animation: floatY 4s ease-in-out infinite;
}

@keyframes floatY {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* ── Cards Grid ───────────────────────────── */
.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 22px;
  padding: 24px 20px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-top: 5px solid transparent;
  border-left: 1px solid #e8edf2;
  border-right: 1px solid #e8edf2;
  border-bottom: 1px solid #e8edf2;
  cursor: pointer;
}

.card.card-active {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  transform: translateY(-4px) scale(1.02);
}

.card.card-active.red   { border-top-color: #dc2626; background: #fef2f2; }
.card.card-active.yellow{ border-top-color: #d97706; background: #fffbeb; }
.card.card-active.blue  { border-top-color: #2563eb; background: #eff6ff; }
.card.card-active.green { border-top-color: #16a34a; background: #f0fdf4; }

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.10);
}

.card img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 16px;
  transition: transform 0.3s ease;
}

.card:hover img { transform: scale(1.06); }

.card.red   { border-top-color: #dc2626; }
.card.yellow{ border-top-color: #d97706; }
.card.blue  { border-top-color: #2563eb; }
.card.green { border-top-color: #16a34a; }

.card-content h3 {
  font-size: 1.15rem;
  margin-bottom: 8px;
  color: #0f172a;
  font-weight: 700;
}

.card-content p {
  color: #94a3b8;
  font-size: 0.88rem;
  margin-bottom: 18px;
  line-height: 1.5;
}

.btn-cat {
  padding: 10px 20px;
  border-radius: 50px;
  border: 2px solid;
  cursor: pointer;
  font-weight: 700;
  font-size: 13.5px;
  transition: all 0.25s ease;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.btn-cat i {
  font-size: 11px;
  transition: transform 0.2s ease;
}

.btn-cat:hover i { transform: translateX(4px); }

.btn-cat-red    { border-color: #fca5a5; color: #dc2626; }
.btn-cat-red:hover { background: #fef2f2; }

.btn-cat-yellow { border-color: #fde68a; color: #d97706; }
.btn-cat-yellow:hover { background: #fffbeb; }

.btn-cat-blue   { border-color: #93c5fd; color: #2563eb; }
.btn-cat-blue:hover { background: #eff6ff; }

.btn-cat-green  { border-color: #86efac; color: #16a34a; }
.btn-cat-green:hover { background: #f0fdf4; }

/* ── Help Box ─────────────────────────────── */
.help-box {
  background: linear-gradient(135deg, #fff5f5 0%, #fef0f0 100%);
  border: 1px solid #fde0e0;
  border-radius: 20px;
  padding: 26px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 14px rgba(192, 21, 42, 0.06);
  gap: 20px;
}

.help-box h4 {
  font-size: 1.2rem;
  margin-bottom: 6px;
  color: #0f172a;
  font-weight: 700;
}

.help-box p { color: #64748b; font-size: 0.9rem; }

.btn-reportar {
  background: linear-gradient(135deg, #c0152a, #a81124);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(192, 21, 42, 0.25);
}

.btn-reportar:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(192, 21, 42, 0.3);
}

/* ── Lista de objetos dinámicos ───────────── */
.objetos-list {
  background: #fff;
  border-radius: 22px;
  padding: 24px 28px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  border: 1px solid #e8edf2;
}

.objetos-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.objetos-list-header h3 {
  font-size: 1.15rem;
  color: #0f172a;
  font-weight: 700;
}

.badge-filtro {
  color: #c0152a;
  font-weight: 600;
  font-size: 0.85rem;
}

.objetos-count {
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 600;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 999px;
}

.objetos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.objeto-card {
  display: flex;
  gap: 14px;
  background: #f8fafc;
  border: 1px solid #e8edf2;
  border-radius: 14px;
  padding: 16px;
  transition: box-shadow 0.2s, transform 0.2s;
}

.objeto-card:hover {
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
  transform: translateY(-2px);
}

.objeto-icon {
  width: 48px;
  height: 48px;
  background: rgba(192, 21, 42, 0.06);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0152a;
  font-size: 18px;
  flex-shrink: 0;
}

.objeto-info {
  flex: 1;
  min-width: 0;
}

.objeto-info h4 {
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 700;
  margin-bottom: 4px;
}

.objeto-info p {
  font-size: 0.82rem;
  color: #64748b;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.objeto-categoria {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 999px;
  margin-right: 8px;
}

.objeto-fecha {
  font-size: 0.72rem;
  color: #c0d0e0;
}

.objetos-empty {
  text-align: center;
  padding: 32px 0;
  color: #94a3b8;
}

/* ── Modal ─────────────────────────────────── */
.required-field {
  color: #dc2626;
}
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
  background: #fff;
}
.modal-input:focus {
  border-color: #c0152a;
  box-shadow: 0 0 0 3px rgba(192, 21, 42, 0.1);
}
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
.btn-save-modal:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Responsive ───────────────────────────── */
@media (max-width: 1100px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .cosas-img { display: none; }
}

@media (max-width: 600px) {
  .main-content { padding: 16px; }
  .cards { grid-template-columns: 1fr; }
  .help-box { flex-direction: column; text-align: center; }
  .title-section h1 { font-size: 1.6rem; }
}
</style>
