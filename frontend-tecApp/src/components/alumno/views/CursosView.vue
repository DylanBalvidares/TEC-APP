<template>
  <main class="content">
    <header class="page-header">
      <div class="page-header-text">
        <h1><i class="fas fa-graduation-cap header-icon"></i> Mi curso</h1>
        <p>Consultá tus materias, comunicados y las personas que forman parte de tu curso.</p>
      </div>
    </header>

    <section class="stats">
      <div class="stat-card stat-red">
        <div class="stat-icon"><i class="fas fa-book-open"></i></div>
        <div class="stat-info">
          <p>Mis Materias</p>
          <h3>{{ materias.length }}</h3>
        </div>
      </div>
      <div class="stat-card stat-green">
        <div class="stat-icon"><i class="fas fa-bullhorn"></i></div>
        <div class="stat-info">
          <p>Comunicados</p>
          <h3>{{ comunicados.length }}</h3>
        </div>
      </div>
    </section>

    <div class="tabs-bar">
      <button class="tab-btn" :class="{ active: tabActivo === 'materias' }" @click="tabActivo = 'materias'">
        <i class="fas fa-table"></i> Mis Materias
      </button>
      <button id="tab-comunicados" class="tab-btn" role="tab" aria-controls="panel-comunicados" :aria-selected="tabActivo === 'comunicados'" :tabindex="tabActivo === 'comunicados' ? 0 : -1" :class="{ active: tabActivo === 'comunicados' }" @click="seleccionarTab('comunicados')">
        <i class="fas fa-bullhorn"></i> Comunicados
      </button>
      <button id="tab-participantes" class="tab-btn" role="tab" aria-controls="panel-participantes" :aria-selected="tabActivo === 'participantes'" :tabindex="tabActivo === 'participantes' ? 0 : -1" :class="{ active: tabActivo === 'participantes' }" @click="seleccionarTab('participantes')">
        <i class="fas fa-users"></i> Participantes
      </button>
    </div>

    <section v-show="tabActivo === 'materias'" class="tab-content">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>MATERIA</th>
              <th>HORARIO</th>
              <th>DÍAS</th>
              <th>PROFESOR</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in materias" :key="m.id">
              <td>
                <strong>{{ m.nombre || m.materia }}</strong>
              </td>
              <td>{{ m.horario }}</td>
              <td>{{ m.dias }}</td>
              <td>{{ m.profesor }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-show="tabActivo === 'comunicados'" class="tab-content">
      <div v-if="comunicados.length === 0" class="comunicados-vacio">
        <i class="fas fa-bullhorn"></i>
        <p>Todavía no hay comunicados para tu curso.</p>
      </div>

      <div v-for="(c, index) in comunicados" :key="c.id_comunicado || index" class="comunicado-card" :class="{ abierto: c.abierto }">
        <button type="button" class="comunicado-header" @click="alternarComunicadoCurso(c)" :aria-expanded="!!c.abierto">
          <div class="comunicado-header-left">
            <div class="comunicado-icono">
              <i class="fas fa-bullhorn"></i>
            </div>
            <div class="comunicado-header-texto">
              <div class="comunicado-titulo">{{ c.titulo }}</div>
              <div class="comunicado-meta">
                {{ formatearFecha(c.fecha_publicacion) }} · {{ nombreAutor(c) }}
              </div>
              <div class="comunicado-tags">
                <span class="badge" :class="claseImportancia(c.importancia)">{{ textoImportancia(c.importancia) }}</span>
                <span class="destino-tag">{{ textoDestino(c) }}</span>
              </div>
            </div>
          </div>
          <i class="fas fa-chevron-down comunicado-toggle"></i>
        </button>
        <div class="comunicado-cuerpo">
          <p>{{ c.mensaje }}</p>
        </div>
      </div>
    </section>

    <section v-show="tabActivo === 'participantes'" id="panel-participantes" class="tab-content participantes-section" role="tabpanel" aria-labelledby="tab-participantes" tabindex="0">
      <p v-if="cargandoParticipantes" class="participantes-mensaje" role="status">Cargando participantes del curso…</p>
      <div v-else-if="errorParticipantes" class="participantes-mensaje participantes-error" role="alert">
        <span>{{ errorParticipantes }}</span>
        <button type="button" class="reintentar-btn" @click="cargarParticipantes">Reintentar</button>
      </div>
      <p v-else-if="!participantes.curso" class="participantes-mensaje">No tenés un curso asignado actualmente.</p>
      <template v-else>
        <h2 class="participantes-curso">{{ participantes.curso.nombre_curso }}</h2>
        <div class="participantes-columnas">
          <section class="participantes-grupo" aria-labelledby="titulo-companeros">
            <h3 id="titulo-companeros"><i class="fas fa-user-friends"></i> Compañeros</h3>
            <p v-if="participantes.companeros.length === 0" class="participantes-vacio">Todavía no hay compañeros para mostrar.</p>
            <ul v-else>
              <li v-for="(companero, index) in participantes.companeros" :key="`${companero.apellido}-${index}`">
                {{ companero.apellido }}, {{ companero.nombre }}
              </li>
            </ul>
          </section>
          <section class="participantes-grupo" aria-labelledby="titulo-docentes">
            <h3 id="titulo-docentes"><i class="fas fa-chalkboard-teacher"></i> Profesores</h3>
            <p v-if="participantes.profesores.length === 0" class="participantes-vacio">Todavía no hay profesores asignados.</p>
            <ul v-else>
              <li v-for="(profesor, index) in participantes.profesores" :key="`${profesor.apellido}-${index}`">
                <strong>{{ profesor.apellido }}, {{ profesor.nombre }}</strong>
                <span v-if="profesor.es_titular" class="participantes-etiqueta">Profesor titular</span>
                <span v-if="profesor.materias.length" class="participantes-materias">{{ profesor.materias.join(' · ') }}</span>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from "vue";
import { useRoute } from "vue-router";
import { obtenerMisMaterias, obtenerMisParticipantes } from "@/services/academico-service.js";
import { obtenerTodosComunicados, marcarComunicadoLeido } from "@/services/comunidad-service.js";
import {
  claseImportancia,
  extraerComunicados,
  formatearFechaComunicado,
  nombreAutor,
  textoDestino,
  textoImportancia,
} from "@/utils/comunicados.js";

const tabActivo = ref("materias");
const materias = ref([]);
const comunicados = ref([]);
const participantes = ref({ curso: null, companeros: [], profesores: [] });
const cargandoMaterias = ref(true);
const cargandoComunicados = ref(true);
const cargandoParticipantes = ref(false);
const errorMaterias = ref("");
const errorComunicados = ref("");
const errorParticipantes = ref("");
const materiasCargadas = ref(false);
const comunicadosCargados = ref(false);
const participantesCargados = ref(false);
const route = useRoute();

const formatearFecha = formatearFechaComunicado;

const cargarParticipantes = async () => {
  cargandoParticipantes.value = true;
  errorParticipantes.value = "";
  const respuesta = await obtenerMisParticipantes();
  participantes.value = respuesta?.data || { curso: null, companeros: [], profesores: [] };
  errorParticipantes.value = respuesta?.success ? "" : (respuesta?.message || "No se pudieron cargar los participantes del curso.");
  participantesCargados.value = Boolean(respuesta?.success);
  cargandoParticipantes.value = false;
};

const seleccionarTab = async (tab) => {
  tabActivo.value = tab;
  if (tab === "participantes" && !participantesCargados.value) await cargarParticipantes();
};
const cargarDatos = async () => {
  try {
    const dataMaterias = await obtenerMisMaterias();
    materias.value = Array.isArray(dataMaterias) ? dataMaterias : [];

    // El nombre del curso del alumno refina el filtro `curso` del backend.
    let cursoAlumno = null;
    try {
      const alumnoRaw = localStorage.getItem("alumno");
      if (alumnoRaw) {
        const alumno = JSON.parse(alumnoRaw);
        cursoAlumno = alumno.curso?.nombre_curso || alumno.data?.curso?.nombre_curso;
      }
    } catch (e) {}

    const respuesta = await obtenerTodosComunicados({ rol: "alumno", curso: cursoAlumno || "" });
    comunicados.value = extraerComunicados(respuesta).map((c) => ({ ...c, abierto: false }));
  } catch (error) {
    console.error("Error al cargar datos del servicio:", error);
    materias.value = [];
    comunicados.value = [];
  }
};

// Abrir el acordeón confirma la lectura: marca silenciosa e idempotente
// (el backend valida destinatario; fallar no interrumpe la vista).
const alternarComunicadoCurso = (comunicado) => {
  comunicado.abierto = !comunicado.abierto;
  if (comunicado.abierto && comunicado.id_comunicado) {
    marcarComunicadoLeido(comunicado.id_comunicado).catch(() => {});
  }
};

onMounted(cargarDatos);
</script>
<style scoped>
.content {
  flex: 1;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f1f5f9;
  gap: 20px;
}

/* ── Page Header ──────────────────────────── */
.page-header {
  width: 100%;
  max-width: 1000px;
}

.page-header h1 {
  font-size: 1.9rem;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: -0.4px;
}

.header-icon { color: #c0152a; }

.page-header p {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 6px;
  margin-left: 48px;
}

/* ── Stats ────────────────────────────────── */
.stats {
  display: flex;
  gap: 16px;
  width: 100%;
  max-width: 1000px;
}

.stat-card {
  background: #fff;
  flex: 1;
  padding: 20px 24px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  border: 1px solid #e8edf2;
  border-left: 5px solid transparent;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.stat-red   { border-left-color: #c0152a; }
.stat-green { border-left-color: #16a34a; }

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-red   .stat-icon { background: rgba(192, 21, 42, 0.08); color: #c0152a; }
.stat-green .stat-icon { background: rgba(22, 163, 74, 0.08); color: #16a34a; }

.stat-info p {
  font-size: 12.5px;
  color: #94a3b8;
  margin-bottom: 2px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-info h3 {
  font-size: 1.7rem;
  font-weight: 800;
  color: #0f172a;
}

/* ── Tabs Bar ─────────────────────────────── */
.tabs-bar {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 1000px;
  background: #fff;
  padding: 6px;
  border-radius: 14px;
  border: 1px solid #e8edf2;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: #94a3b8;
  transition: all 0.2s ease;
}

.tab-btn:hover { background: #f1f5f9; color: #64748b; }

.tab-btn.active {
  background: #c0152a;
  color: #fff;
  box-shadow: 0 4px 12px rgba(192, 21, 42, 0.22);
}

/* ── Tab Content ──────────────────────────── */
.tab-content {
  width: 100%;
  max-width: 1000px;
}

/* ── Tabla ────────────────────────────────── */
.table-container {
  background: #fff;
  padding: 8px 8px 4px;
  border-radius: 18px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  border: 1px solid #e8edf2;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  padding: 14px 18px;
  border-bottom: 2px solid #f1f5f9;
  text-align: left;
}

td {
  padding: 16px 18px;
  border-bottom: 1px solid #f8fafc;
  color: #334155;
  font-size: 0.9rem;
}

td strong { font-weight: 700; color: #0f172a; }

tbody tr:hover td { background: #f8fafc; }
tbody tr:last-child td { border-bottom: none; }

/* ── Comunicados Acordeón ─────────────────── */
.comunicados-vacio {
  background: #fff;
  border: 1px dashed #e2e8f0;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.comunicados-vacio i { font-size: 2.2rem; opacity: 0.5; }
.comunicados-vacio p { margin: 0; font-size: 0.95rem; }

.comunicado-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8edf2;
  margin-bottom: 12px;
  border-left: 4px solid #c0152a;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.2s;
  overflow: hidden;
}

.comunicado-card.abierto {
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
}

.comunicado-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.15s;
  background: transparent;
  border: none;
  font: inherit;
  color: inherit;
  text-align: left;
  box-sizing: border-box;
}

.comunicado-header:hover { background: #fafafa; }
.comunicado-header:focus-visible {
  outline: 2px solid #c0152a;
  outline-offset: -2px;
}

.comunicado-header-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.comunicado-header-texto { min-width: 0; }

.comunicado-icono {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(192, 21, 42, 0.08);
  color: #c0152a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}

.comunicado-titulo {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  overflow-wrap: break-word;
}

.comunicado-meta {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 3px;
}

.comunicado-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.badge {
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.badge-alta  { background: #fee2e2; color: #dc2626; }
.badge-media { background: #fef3c7; color: #b45309; }
.badge-baja  { background: #dcfce7; color: #16a34a; }

.destino-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 3px 10px;
}

.comunicado-toggle {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #c0d0e0;
  font-size: 12px;
  flex-shrink: 0;
}

.comunicado-card.abierto .comunicado-toggle { transform: rotate(180deg); }

.comunicado-cuerpo {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0 20px;
}

.comunicado-card.abierto .comunicado-cuerpo {
  max-height: 600px;
  padding: 14px 20px 20px;
  border-top: 1px solid #f1f5f9;
}

.comunicado-cuerpo p {
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.participantes-section { gap: 18px; }
.participantes-mensaje, .participantes-vacio { color: #64748b; margin: 0; }
.participantes-error { color: #b91c1c; }
.participantes-curso { margin: 0; color: #0f172a; font-size: 1.1rem; }
.participantes-columnas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.participantes-grupo { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
.participantes-grupo h3 { margin: 0 0 12px; color: #0f172a; font-size: 1rem; }
.participantes-grupo h3 i { color: #c0152a; margin-right: 7px; }
.participantes-grupo ul { list-style: none; margin: 0; padding: 0; }
.participantes-grupo li { padding: 10px 0; border-top: 1px solid #f1f5f9; color: #334155; }
.participantes-etiqueta { margin-left: 8px; padding: 3px 8px; border-radius: 999px; background: #fee2e2; color: #b91c1c; font-size: 0.72rem; font-weight: 700; }
.participantes-materias { display: block; margin-top: 4px; color: #64748b; font-size: 0.82rem; }

/* ── Responsive ───────────────────────────── */
@media (max-width: 700px) {
  .content { padding: 16px; }
  .stats { flex-direction: column; }
  .page-header p { margin-left: 0; }
  .participantes-columnas { grid-template-columns: 1fr; }
  .tabs-bar { overflow-x: auto; }
  .tab-btn { flex: 0 0 auto; padding: 10px 14px; }
}
</style>
