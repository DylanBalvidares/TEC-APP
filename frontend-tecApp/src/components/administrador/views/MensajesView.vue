<template>
  <div class="monitor-wrapper">
    <!-- ── Tarjetas de resumen ─────────────────────────────────────── -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon si-total">
          <i class="ti ti-brand-whatsapp" aria-hidden="true"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">Total mensajes (global)</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon si-ok">
          <i class="ti ti-check" aria-hidden="true"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ counts.enviado }}</span>
          <span class="stat-label">Enviados (esta página)</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon si-fail">
          <i class="ti ti-x" aria-hidden="true"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ counts.fallido }}</span>
          <span class="stat-label">Fallidos (esta página)</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon si-pending">
          <i class="ti ti-clock" aria-hidden="true"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ counts.pendiente }}</span>
          <span class="stat-label">Pendientes (esta página)</span>
        </div>
      </div>
    </div>

    <!-- ── Card principal ──────────────────────────────────────────── -->
    <div class="card animate-fade-in">
      <div class="card-header">
        <div class="card-title">
          <i class="ti ti-brand-whatsapp" aria-hidden="true"></i>
          Gestión de WhatsApp (control total)
        </div>
        <button
          class="icon-btn"
          title="Actualizar"
          aria-label="Actualizar historial"
          :disabled="cargando"
          @click="cargar"
        >
          <i class="ti ti-refresh" :class="{ 'animate-spin': cargando }"></i>
        </button>
      </div>

      <!-- Toolbar: búsqueda + filtros -->
      <div class="toolbar">
        <div class="search-box">
          <i class="ti ti-search"></i>
          <input
            v-model="borrador.buscar"
            type="text"
            placeholder="Buscar por texto, teléfono o destinatario..."
            aria-label="Buscar en el historial"
            @keyup.enter="aplicarFiltros"
          />
          <button
            v-if="borrador.buscar"
            class="search-clear"
            aria-label="Limpiar búsqueda"
            @click="borrador.buscar = ''"
          >
            <i class="ti ti-x"></i>
          </button>
        </div>
        <div class="filter-row">
          <div class="form-group inline">
            <label for="f-estado">Estado</label>
            <select id="f-estado" v-model="borrador.estado">
              <option value="">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="enviado">Enviados</option>
              <option value="fallido">Fallidos</option>
              <option value="leido">Leídos</option>
            </select>
          </div>
          <div class="form-group inline">
            <label for="f-desde">Desde</label>
            <input id="f-desde" v-model="borrador.desde" type="date" />
          </div>
          <div class="form-group inline">
            <label for="f-hasta">Hasta</label>
            <input id="f-hasta" v-model="borrador.hasta" type="date" />
          </div>
          <button class="tb-btn primary sm" :disabled="cargando" @click="aplicarFiltros">
            <i class="ti ti-filter" aria-hidden="true"></i>
            Aplicar
          </button>
          <button class="tb-btn outline sm" :disabled="cargando" @click="limpiarFiltros">
            Limpiar
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <div v-if="cargando" class="empty-state">
          <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
          <p>Cargando historial...</p>
        </div>

        <div v-else-if="errorCarga" class="error-banner" style="margin: 16px">
          <i class="ti ti-alert-circle"></i> {{ errorCarga }}
          <button class="tb-btn sm outline" style="margin-left: auto" @click="cargar">
            Reintentar
          </button>
        </div>

        <HistorialMensajes
          v-else
          :mensajes="lista"
          mensaje-vacio="No hay mensajes con esos filtros."
          mostrar-remitente
          mostrar-acciones
          :mapa-roles="mapaRoles"
          :ocupado="ocupado"
          @ver="verDetalle"
          @reenviar="reenviar"
          @leido="marcarLeido"
          @eliminar="pedirEliminar"
        />
      </div>

      <Pagination
        :current-page="page"
        :total-items="total"
        :page-size="pageSize"
        @page-change="goToPage"
        @page-size-change="setPageSize"
      />
    </div>

    <DetalleMensajeModal v-model="modalDetalle" :mensaje="sel" />

    <Modal v-model="modalEliminar" title="Eliminar registro">
      <p>
        ¿Eliminar el registro del mensaje a
        <strong>{{ sel?.telefono_destino }}</strong
        >? No borra el WhatsApp ya entregado, solo el historial.
      </p>
      <template #footer>
        <button class="tb-btn outline" @click="modalEliminar = false">Cancelar</button>
        <button class="tb-btn primary" :disabled="eliminando" @click="eliminar">
          {{ eliminando ? "Eliminando..." : "Eliminar" }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import Modal from "@/components/ui/Modal.vue";
import Pagination from "@/components/ui/Pagination.vue";
import HistorialMensajes from "@/components/whatsapp/HistorialMensajes.vue";
import DetalleMensajeModal from "@/components/whatsapp/DetalleMensajeModal.vue";
import { toast } from "@/services/toast-service.js";
import {
  obtenerTodosMensajes,
  reenviarMensaje,
  marcarMensajeLeido,
  eliminarMensaje,
} from "@/services/mensajes-service.js";
import { obtenerUsuarios } from "@/services/usuarios-services.js";

const lista = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const cargando = ref(false);
const errorCarga = ref("");
const eliminando = ref(false);
const ocupado = ref(null);
const modalDetalle = ref(false);
const modalEliminar = ref(false);
const sel = ref(null);
const mapaRoles = ref({});

// Borrador (inputs) vs aplicados (los que viajan a la API).
const borrador = reactive({ buscar: "", estado: "", desde: "", hasta: "" });
const aplicados = reactive({ buscar: "", estado: "", desde: "", hasta: "" });

const counts = computed(() => ({
  enviado: lista.value.filter((m) => m.estado === "enviado").length,
  fallido: lista.value.filter((m) => m.estado === "fallido").length,
  pendiente: lista.value.filter((m) => m.estado === "pendiente").length,
}));

const params = () => ({
  buscar: aplicados.buscar || undefined,
  estado: aplicados.estado || undefined,
  desde: aplicados.desde || undefined,
  hasta: aplicados.hasta || undefined,
  limit: pageSize.value,
  offset: (page.value - 1) * pageSize.value,
});

const cargar = async () => {
  cargando.value = true;
  errorCarga.value = "";
  const res = await obtenerTodosMensajes(params());
  cargando.value = false;
  if (res.success) {
    lista.value = res.data;
    total.value = res.total;
  } else {
    errorCarga.value = "No se pudo cargar el historial de WhatsApp. Verificá la conexión con el servidor.";
  }
};

const cargarRoles = async () => {
  try {
    const res = await obtenerUsuarios();
    const usuarios = res?.data?.data ?? res?.data ?? [];
    const mapa = {};
    if (Array.isArray(usuarios)) {
      for (const u of usuarios) {
        const id = u.id_usuario ?? u.id;
        if (id != null) mapa[id] = u.rol?.nombre_rol || u.nombre_rol || "";
      }
    }
    mapaRoles.value = mapa;
  } catch {
    // Si falla, la columna muestra solo el ID crudo.
    mapaRoles.value = {};
  }
};

const aplicarFiltros = async () => {
  Object.assign(aplicados, borrador);
  page.value = 1;
  await cargar();
};

const limpiarFiltros = async () => {
  Object.assign(borrador, { buscar: "", estado: "", desde: "", hasta: "" });
  Object.assign(aplicados, { buscar: "", estado: "", desde: "", hasta: "" });
  page.value = 1;
  await cargar();
};

const goToPage = (p) => {
  page.value = p;
  cargar();
};

const setPageSize = (s) => {
  pageSize.value = s;
  page.value = 1;
  cargar();
};

const verDetalle = (m) => {
  sel.value = m;
  modalDetalle.value = true;
};

const reenviar = async (m) => {
  ocupado.value = { id: m.id_mensaje, tipo: "reenviar" };
  const res = await reenviarMensaje(m.id_mensaje);
  ocupado.value = null;
  if (res.success) {
    toast.success("Mensaje reenviado");
    cargar();
  } else {
    toast.error(res.message);
  }
};

const marcarLeido = async (m) => {
  ocupado.value = { id: m.id_mensaje, tipo: "leido" };
  const res = await marcarMensajeLeido(m.id_mensaje);
  ocupado.value = null;
  if (res.success) {
    const idx = lista.value.findIndex((x) => x.id_mensaje === m.id_mensaje);
    if (idx !== -1) {
      lista.value[idx] = { ...lista.value[idx], leido: true, estado: "leido" };
    }
  } else {
    toast.error(res.message);
  }
};

const pedirEliminar = (m) => {
  sel.value = m;
  modalEliminar.value = true;
};

const eliminar = async () => {
  eliminando.value = true;
  const res = await eliminarMensaje(sel.value.id_mensaje);
  eliminando.value = false;
  modalEliminar.value = false;
  if (res.success) {
    toast.success("Registro eliminado");
    cargar();
  } else {
    toast.error(res.message);
  }
};

onMounted(() => Promise.all([cargar(), cargarRoles()]));
</script>

<style scoped>
.monitor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1100px;
}
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-background-primary, #fff);
  border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  padding: 14px 16px;
}
.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.si-total { background: #f3f4f6; color: #4b5563; }
.si-ok { background: #eaf3de; color: #3b6d11; }
.si-fail { background: #fee2e2; color: #991b1b; }
.si-pending { background: #fef3c7; color: #92400e; }
.stat-info { display: flex; flex-direction: column; gap: 2px; }
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary, #111827);
  line-height: 1;
}
.stat-label { font-size: 12px; color: var(--color-text-tertiary, #6b7280); }
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px 0 20px;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  padding-bottom: 16px;
}
.form-group.inline { min-width: 140px; }
.table-responsive { overflow-x: auto; }
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
@media (max-width: 768px) {
  .stat-cards { grid-template-columns: 1fr 1fr; }
}
</style>
