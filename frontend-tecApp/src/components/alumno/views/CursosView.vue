<template>
  <main class="content">
    <header class="page-header">
      <div class="page-header-text">
        <h1><i class="fas fa-graduation-cap header-icon"></i> Mis Materias</h1>
        <p>Revisá tus materias, los materiales subidos por tus profesores y los comunicados del curso.</p>
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
      <button class="tab-btn" :class="{ active: tabActivo === 'comunicados' }" @click="tabActivo = 'comunicados'">
        <i class="fas fa-bullhorn"></i> Comunicados
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
      <div v-for="(c, index) in comunicados" :key="c.id || index" class="comunicado-card" :class="{ abierto: c.abierto }">
        <div class="comunicado-header" @click="c.abierto = !c.abierto">
          <div class="comunicado-header-left">
            <div class="comunicado-icono">
              <i class="fas fa-bullhorn"></i>
            </div>
            <div>
              <div class="comunicado-titulo">{{ c.titulo }}</div>
              <div class="comunicado-meta">{{ formatDate(c.fecha) }} · {{ c.profesor }}</div>
            </div>
          </div>
          <i class="fas fa-chevron-down comunicado-toggle"></i>
        </div>
        <div class="comunicado-cuerpo">
          <p>{{ c.contenido }}</p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { obtenerMisMaterias, obtenerComunicados } from "@/services/academico-service.js";
import { formatDate } from "@/utils/formatters.js";

const tabActivo = ref("materias");
const materias = ref([]);
const comunicados = ref([]);

const cargarDatos = async () => {
  try {
    const dataMaterias = await obtenerMisMaterias();

    // Obtener el nombre del curso del alumno para filtrar comunicados
    let cursoAlumno = null;
    try {
      const alumnoRaw = localStorage.getItem("alumno");
      if (alumnoRaw) {
        const alumno = JSON.parse(alumnoRaw);
        cursoAlumno = alumno.curso?.nombre_curso || alumno.data?.curso?.nombre_curso;
      }
    } catch (e) {}

    // Filtrar comunicados: solo los dirigidos a alumnos, a todos, o a su curso específico
    const dataComunicados = await obtenerComunicados({ rol: "alumno", curso: cursoAlumno || "" });

    materias.value = Array.isArray(dataMaterias) ? dataMaterias : [];

    // obtenerComunicados devuelve { success, data }, extraemos el arreglo
    const comunicadosArray =
      dataComunicados?.success && Array.isArray(dataComunicados.data)
        ? dataComunicados.data
        : Array.isArray(dataComunicados)
          ? dataComunicados
          : [];
    comunicados.value = comunicadosArray.map((c) => ({ ...c, abierto: false }));
  } catch (error) {
    console.error("Error al cargar datos del servicio:", error);
    materias.value = [];
    comunicados.value = [];
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
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.15s;
}

.comunicado-header:hover { background: #fafafa; }

.comunicado-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

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
}

.comunicado-meta {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 3px;
}

.comunicado-toggle {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #c0d0e0;
  font-size: 12px;
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
}

/* ── Responsive ───────────────────────────── */
@media (max-width: 700px) {
  .content { padding: 16px; }
  .stats { flex-direction: column; }
  .page-header p { margin-left: 0; }
}
</style>
