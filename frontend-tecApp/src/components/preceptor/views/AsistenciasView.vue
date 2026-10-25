
<template>
  <div class="asistencias-page">
    <!-- Encabezado de la página -->
    <header class="as-head">
      <div>
        <h1>Asistencias <span class="as-title-icon">✓</span></h1>
        <p>Registrá y gestioná las asistencias diarias y por materia de los alumnos a tu cargo.</p>
      </div>

      <div class="as-actions">
        <button class="as-btn as-btn-outline" @click="abrirImportador" title="Cargar asistencias desde un archivo CSV o TXT">
          ↑ Importar desde archivo
        </button>
        <input
          ref="archivoInput"
          type="file"
          accept=".csv,.txt"
          hidden
          @change="importarArchivo"
        />
        <button class="as-btn as-btn-green" @click="abrirTomar">
          + Tomar asistencia
        </button>
      </div>
    </header>

    <!-- Banner informativo de Asistencias -->
    <div class="preceptor-info-banner">
      <i class="fas fa-circle-info"></i>
      <div>
        <strong>Gestión de Presentismo:</strong> Podés registrar asistencia en lote mediante <em>+ Tomar asistencia</em>, ajustar estados de alumnos puntuales desde la tabla inferior o revisar el historial por fecha. Las ausencias computan para el seguimiento de regularidad.
      </div>
    </div>

    <!-- Estadísticas -->
    <section class="as-stats">
      <article class="as-stat">
        <div class="as-stat-icon green">✓</div>
        <div>
          <span>Asistencias hoy</span>
          <div class="as-stat-value">
            {{ estadisticas.presentesHoy }}
            <small>/ {{ estadisticas.totalHoy }}</small>
          </div>
          <button class="as-stat-link green" @click="filtrarEstado('presente')">
            Ver detalles →
          </button>
        </div>
      </article>

      <article class="as-stat">
        <div class="as-stat-icon orange">!</div>
        <div>
          <span>Ausencias hoy</span>
          <div class="as-stat-value">{{ estadisticas.ausentesHoy }}</div>
          <button class="as-stat-link orange" @click="filtrarEstado('ausente')">
            Ver detalles →
          </button>
        </div>
      </article>

      <article class="as-stat">
        <div class="as-stat-icon purple">%</div>
        <div>
          <span>Porcentaje general</span>
          <div class="as-stat-value">{{ estadisticas.porcentaje }}%</div>
          <button class="as-stat-link purple" @click="abrirHistorial()">
            Ver estadísticas →
          </button>
        </div>
      </article>

      <article class="as-stat">
        <div class="as-stat-icon blue">▦</div>
        <div>
          <span>Registros esta semana</span>
          <div class="as-stat-value">{{ estadisticas.semana }}</div>
          <button class="as-stat-link blue" @click="abrirHistorial()">
            Ver historial →
          </button>
        </div>
      </article>
    </section>

    <!-- Filtros -->
    <section class="as-card as-filters">
      <div class="as-field">
        <label for="as-curso">Curso</label>
        <select id="as-curso" v-model.number="cursoSeleccionado" @change="cargarCurso">
          <option v-for="curso in cursos" :key="curso.id" :value="curso.id">
            {{ curso.nombre }}
          </option>
        </select>
      </div>

      <div class="as-field">
        <label for="as-fecha">Fecha</label>
        <input id="as-fecha" v-model="fecha" type="date" />
      </div>

      <div class="as-field">
        <label for="as-materia">Materia (opcional)</label>
        <select id="as-materia" v-model="materia">
          <option value="">Todas</option>
        </select>
      </div>

      <div class="as-search">
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar alumno..."
          aria-label="Buscar alumno"
        />
        <span>⌕</span>
      </div>

      <div class="as-filter-wrap">
        <button class="as-btn as-btn-outline" @click="mostrarFiltros = !mostrarFiltros">
          ⚑ Filtros
        </button>

        <div v-if="mostrarFiltros" class="as-dropdown">
          <label for="as-estado-filtro">Estado</label>
          <select id="as-estado-filtro" v-model="filtroEstado">
            <option value="">Todos</option>
            <option v-for="estado in estados" :key="estado.value" :value="estado.value">
              {{ estado.label }}
            </option>
          </select>
          <button class="as-text-button" @click="limpiarFiltros">Limpiar filtros</button>
        </div>
      </div>
    </section>

    <!-- Tabla y resumen -->
    <section class="as-layout">
      <div class="as-card as-table-card">
        <div class="as-table-head">
          <h2>Asistencia del {{ nombreCurso }} · {{ fechaFormateada }}</h2>
          <div class="as-counters">
            <span class="green">Presentes: {{ conteoDia.presente }}</span>
            <span class="red">Ausentes: {{ conteoDia.ausente }}</span>
            <span>Total: {{ alumnosDelCurso.length }}</span>
          </div>
        </div>

        <div v-if="cargando" class="as-message">Cargando asistencias...</div>

        <div v-else-if="errorCarga" class="as-message as-error">
          {{ errorCarga }}
          <button class="as-text-button" @click="cargarCurso">Reintentar</button>
        </div>

        <div v-else-if="filasFiltradas.length === 0" class="as-message">
          {{ alumnosDelCurso.length
            ? 'No hay alumnos que coincidan con los filtros.'
            : 'No hay alumnos para mostrar en este curso.' }}
        </div>

        <div v-else class="as-table-scroll">
          <table class="as-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Alumno</th>
                <th>Estado</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Observaciones</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(fila, index) in filasVisibles" :key="fila.alumno.id_alumno">
                <td>{{ index + 1 }}</td>
                <td>
                  <div class="as-alumno">
                    <span
                      class="as-avatar"
                      :style="estiloAvatar(fila.alumno.id_alumno)"
                    >
                      {{ iniciales(fila.alumno) }}
                    </span>
                    <span>{{ nombreCompleto(fila.alumno) }}</span>
                  </div>
                </td>
                <td>
                  <select
                    class="as-status"
                    :class="fila.registro?.estado || 'pendiente'"
                    :value="fila.registro?.estado || ''"
                    :disabled="guardando"
                    @change="cambiarEstado(fila.alumno, $event.target.value)"
                  >
                    <option value="">Sin registrar</option>
                    <option v-for="estado in estados" :key="estado.value" :value="estado.value">
                      {{ estado.label }}
                    </option>
                  </select>
                </td>
                <td>{{ fila.registro?.estado === 'presente' || fila.registro?.estado === 'tarde' ? '—' : '--:--' }}</td>
                <td>--:--</td>
                <td class="as-observation">
                  {{ observacionDe(fila.alumno.id_alumno, fila.registro) }}
                  <button
                    class="as-icon-button"
                    title="Agregar observación"
                    @click="abrirObservacion(fila.alumno.id_alumno)"
                  >✎</button>
                </td>
                <td>
                  <button
                    class="as-icon-button"
                    title="Ver acciones"
                    @click="alternarMenu(fila.alumno.id_alumno)"
                  >⋮</button>

                  <div
                    v-if="menuAlumno === fila.alumno.id_alumno"
                    class="as-row-menu"
                  >
                    <button @click="abrirObservacion(fila.alumno.id_alumno)">
                      Agregar observación
                    </button>
                    <button @click="abrirHistorial(fila.alumno.id_alumno)">
                      Ver historial del alumno
                    </button>
                    <button class="danger" @click="eliminarRegistro(fila.alumno)">
                      Eliminar registro
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          v-if="filasFiltradas.length > cantidadVisible"
          class="as-more"
          @click="cantidadVisible += 10"
        >
          Ver más alumnos ↓
        </button>
      </div>

      <!-- Resumen del curso -->
      <aside class="as-card as-summary">
        <h2>Resumen del curso</h2>

        <div
          class="as-donut"
          :style="{ background: fondoDonut }"
        >
          <div class="as-donut-inner">
            <strong>{{ alumnosDelCurso.length }}</strong>
            <span>Alumnos</span>
          </div>
        </div>

        <ul class="as-legend">
          <li>
            <i class="green"></i><span>Presentes</span>
            <b>{{ conteoDia.presente }}</b>
            <em>{{ porcentajeEstado('presente') }}%</em>
          </li>
          <li>
            <i class="orange"></i><span>Tardes</span>
            <b>{{ conteoDia.tarde }}</b>
            <em>{{ porcentajeEstado('tarde') }}%</em>
          </li>
          <li>
            <i class="red"></i><span>Ausentes</span>
            <b>{{ conteoDia.ausente }}</b>
            <em>{{ porcentajeEstado('ausente') }}%</em>
          </li>
          <li>
            <i class="blue"></i><span>Justificados</span>
            <b>{{ conteoDia.justificado }}</b>
            <em>{{ porcentajeEstado('justificado') }}%</em>
          </li>
        </ul>

        <button class="as-btn as-btn-outline as-wide" @click="abrirHistorial()">
          ▦ Ver historial del curso
        </button>
      </aside>
    </section>

    <!-- Modal: tomar asistencia -->
    <div v-if="modalTomar" class="as-modal" @click.self="modalTomar = false">
      <div class="as-modal-box">
        <div class="as-modal-head">
          <h2>Tomar asistencia</h2>
          <button class="as-close" @click="modalTomar = false">×</button>
        </div>

        <p class="as-muted">{{ nombreCurso }} · {{ fechaFormateada }}</p>

        <div class="preceptor-info-banner subtle" style="margin-bottom: 12px; font-size: 13px;">
          <i class="fas fa-circle-question"></i>
          <div>
            <strong>Consejo rápido:</strong> Podés presionar <em>Todos presentes</em> y luego cambiar manualmente sólo a los estudiantes ausentes o que llegaron tarde. Estados: <strong>P</strong> (Presente), <strong>A</strong> (Ausente), <strong>T</strong> (Tarde), <strong>J</strong> (Justificada).
          </div>
        </div>

        <div class="as-modal-tools">
          <button class="as-btn as-btn-outline" @click="marcarTodos('presente')">
            Todos presentes
          </button>
          <button class="as-btn as-btn-outline" @click="marcarTodos('ausente')">
            Todos ausentes
          </button>
        </div>

        <div class="as-modal-body">
          <div v-for="alumno in alumnosDelCurso" :key="alumno.id_alumno" class="as-batch-row">
            <span>{{ nombreCompleto(alumno) }}</span>
            <select
              v-model="registrosLote[alumno.id_alumno]"
              class="as-status"
              :class="registrosLote[alumno.id_alumno]"
            >
              <option v-for="estado in estados" :key="estado.value" :value="estado.value">
                {{ estado.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="as-modal-foot">
          <button class="as-btn as-btn-outline" @click="modalTomar = false">Cancelar</button>
          <button class="as-btn as-btn-green" :disabled="guardando" @click="guardarLote">
            {{ guardando ? 'Guardando...' : 'Guardar asistencia' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: historial -->
    <div v-if="modalHistorial" class="as-modal" @click.self="modalHistorial = false">
      <div class="as-modal-box as-modal-wide">
        <div class="as-modal-head">
          <h2>{{ alumnoHistorial ? 'Historial del alumno' : 'Historial del curso' }}</h2>
          <button class="as-close" @click="modalHistorial = false">×</button>
        </div>

        <div class="as-modal-tools">
          <label>Desde <input v-model="fechaDesde" type="date" /></label>
          <label>Hasta <input v-model="fechaHasta" type="date" /></label>
          <button class="as-btn as-btn-outline" @click="buscarHistorial">Buscar</button>
        </div>

        <div v-if="cargandoHistorial" class="as-message">Cargando historial...</div>
        <div v-else class="as-table-scroll">
          <table class="as-table">
            <thead>
              <tr><th>Fecha</th><th>Alumno</th><th>Estado</th></tr>
            </thead>
            <tbody>
              <tr v-for="registro in historialFiltrado" :key="registro.id_asistencia">
                <td>{{ formatearFecha(registro.fecha) }}</td>
                <td>{{ nombreRegistro(registro) }}</td>
                <td>
                  <span class="as-status-label" :class="registro.estado">
                    {{ etiquetaEstado(registro.estado) }}
                  </span>
                </td>
              </tr>
              <tr v-if="!historialFiltrado.length">
                <td colspan="3">No hay registros en ese período.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal: observación -->
    <div v-if="modalObservacion" class="as-modal" @click.self="modalObservacion = false">
      <div class="as-modal-box as-modal-small">
        <div class="as-modal-head">
          <h2>Observación</h2>
          <button class="as-close" @click="modalObservacion = false">×</button>
        </div>

        <textarea
          v-model="textoObservacion"
          rows="4"
          placeholder="Ej.: Falta justificada (certificado)"
        ></textarea>

        <div class="as-modal-foot">
          <button class="as-btn as-btn-outline" @click="modalObservacion = false">Cancelar</button>
          <button class="as-btn as-btn-green" @click="guardarObservacion">Guardar</button>
        </div>
      </div>
    </div>

    <!-- Mensajes -->
    <div v-if="mensaje" class="as-toast" :class="tipoMensaje">
      {{ mensaje }}
      <button @click="mensaje = ''">×</button>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch } from "vue";

import {
  obtenerCursos,
  obtenerAlumnosCurso,
  obtenerAsistencias,
  obtenerHistorialAsistenciasCurso,
  obtenerHistorialAsistencias,
  registrarAsistenciasLote,
  crearAsistencia,
  modificarAsistencia,
  eliminarAsistencia,
} from "@/services/academico-service.js";

import { useAuthStore } from "@/stores/auth.js";

const authStore = useAuthStore();

const estados = [
  { value: "presente", label: "Presente" },
  { value: "ausente", label: "Ausente" },
  { value: "tarde", label: "Tarde" },
  { value: "justificado", label: "Justificado" },
];

const cursos = ref([]);
const cursoSeleccionado = ref(null);
const alumnosDelCurso = ref([]);
const registrosCurso = ref([]);
const todosLosRegistros = ref([]);

const fecha = ref(fechaHoy());
const materia = ref("");
const busqueda = ref("");
const filtroEstado = ref("");
const mostrarFiltros = ref(false);
const cantidadVisible = ref(6);

const cargando = ref(false);
const guardando = ref(false);
const errorCarga = ref("");

const modalTomar = ref(false);
const modalHistorial = ref(false);
const modalObservacion = ref(false);
const cargandoHistorial = ref(false);

const historial = ref([]);
const fechaDesde = ref("");
const fechaHasta = ref("");
const alumnoHistorial = ref(null);

const registrosLote = ref({});
const alumnoObservacion = ref(null);
const textoObservacion = ref("");
const menuAlumno = ref(null);

const archivoInput = ref(null);
const mensaje = ref("");
const tipoMensaje = ref("ok");

let mensajeTimeout = null;

// --------------------------------------------------
// USUARIO AUTENTICADO
// --------------------------------------------------

function obtenerIdUsuario() {
  return (
    authStore.usuario?.id_usuario ??
    authStore.usuario?.id ??
    null
  );
}

// --------------------------------------------------
// NORMALIZACIÓN DE RESPUESTAS DE LA API
// --------------------------------------------------

function normalizarLista(resultado) {
  let datos = resultado?.data ?? resultado;

  // Admite respuestas de la API que envuelven la lista
  // dentro de una propiedad.
  for (let intento = 0; intento < 3; intento++) {
    if (Array.isArray(datos)) return datos;
    if (!datos || typeof datos !== "object") return [];

    const posiblesListas = [
      "datos",
      "asistencias",
      "alumnos",
      "cursos",
      "historial",
      "registros",
      "resultados",
      "data",
    ];

    const propiedad = posiblesListas.find(
      clave => Array.isArray(datos[clave])
    );

    if (propiedad) return datos[propiedad];

    // Algunas respuestas pueden envolver los datos en otro objeto.
    if (datos.data && typeof datos.data === "object") {
      datos = datos.data;
    } else {
      return [];
    }
  }

  return Array.isArray(datos) ? datos : [];
}

function normalizarCurso(curso) {
  return (
  [
    curso.anio != null ? `${curso.anio}° año` : "",
    curso.division ?? "",
  ]
    .filter(Boolean)
    .join(" ") || "Curso"
  );
};


function normalizarAlumno(alumno) {
  return {
    ...alumno,
    id_alumno: alumno.id_alumno ?? alumno.id,
  };
}

function fechaDeRegistro(registro) {
  return String(registro?.fecha ?? "").slice(0, 10);
}

// --------------------------------------------------
// FECHAS Y TEXTOS
// --------------------------------------------------

function fechaISO(dia) {
  const anio = dia.getFullYear();
  const mes = String(dia.getMonth() + 1).padStart(2, "0");
  const numeroDia = String(dia.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${numeroDia}`;
}

function fechaHoy() {
  return fechaISO(new Date());
}

function formatearFecha(valor) {
  if (!valor) return "—";

  const partes = String(valor).slice(0, 10).split("-");

  if (partes.length !== 3) return valor;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function nombreCompleto(alumno) {
  return `${alumno?.nombre || ""} ${alumno?.apellido || ""}`.trim()
    || alumno?.nombre_completo
    || "Alumno sin nombre";
}

function iniciales(alumno) {
  const nombre = alumno?.nombre || "";
  const apellido = alumno?.apellido || "";

  if (!nombre && alumno?.nombre_completo) {
    return alumno.nombre_completo.slice(0, 2).toUpperCase();
  }

  return `${nombre[0] || ""}${apellido[0] || ""}`.toUpperCase();
}

function etiquetaEstado(estado) {
  return estados.find(e => e.value === estado)?.label || estado || "Sin registrar";
}

function estiloAvatar(id) {
  const paleta = [
    ["#efe8fd", "#7c3aed"],
    ["#e6f6ee", "#12995b"],
    ["#fdeaea", "#ef4444"],
    ["#fff3df", "#d98200"],
    ["#e3eefc", "#2563eb"],
  ];

  const [background, color] =
    paleta[Math.abs(Number(id) || 0) % paleta.length];

  return { background, color };
}

function mostrarMensaje(texto, tipo = "ok") {
  mensaje.value = texto;
  tipoMensaje.value = tipo;

  if (mensajeTimeout) {
    clearTimeout(mensajeTimeout);
  }

  mensajeTimeout = window.setTimeout(() => {
    mensaje.value = "";
  }, 3200);
}

// --------------------------------------------------
// CURSO SELECCIONADO
// --------------------------------------------------

const nombreCurso = computed(() => {
  return (
    cursos.value.find(
      c => Number(c.id) === Number(cursoSeleccionado.value)
    )?.nombre || ""
  );
});

const fechaFormateada = computed(() => formatearFecha(fecha.value));

// --------------------------------------------------
// REGISTROS DE LA FECHA SELECCIONADA
// --------------------------------------------------

const filasDelDia = computed(() => {
  const mapa = new Map();

  registrosCurso.value
    .filter(r => fechaDeRegistro(r) === fecha.value)
    .forEach(r => {
      mapa.set(Number(r.id_alumno), r);
    });

  return alumnosDelCurso.value.map(alumno => ({
    alumno,
    registro: mapa.get(Number(alumno.id_alumno)) || null,
  }));
});

const filasFiltradas = computed(() => {
  const texto = busqueda.value.trim().toLocaleLowerCase("es");

  return filasDelDia.value.filter(({ alumno, registro }) => {
    const nombre = nombreCompleto(alumno).toLocaleLowerCase("es");

    return (
      (!texto || nombre.includes(texto)) &&
      (!filtroEstado.value || registro?.estado === filtroEstado.value)
    );
  });
});

const filasVisibles = computed(() => {
  return filasFiltradas.value.slice(0, cantidadVisible.value);
});

// --------------------------------------------------
// CONTADORES
// --------------------------------------------------

const conteoDia = computed(() => {
  const conteo = {
    presente: 0,
    tarde: 0,
    ausente: 0,
    justificado: 0,
  };

  filasDelDia.value.forEach(({ registro }) => {
    if (registro?.estado && conteo[registro.estado] !== undefined) {
      conteo[registro.estado]++;
    }
  });

  return conteo;
});

const estadisticas = computed(() => {
  const hoy = fechaHoy();

  const registrosHoy = todosLosRegistros.value.filter(
    r => fechaDeRegistro(r) === hoy
  );

  const asistencias = todosLosRegistros.value.filter(
    r => r.estado === "presente" || r.estado === "tarde"
  ).length;

  const inicioSemana = new Date();
  inicioSemana.setDate(
    inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7)
  );

  const desde = fechaISO(inicioSemana);

  return {
    presentesHoy: registrosHoy.filter(
      r => r.estado === "presente" || r.estado === "tarde"
    ).length,

    totalHoy: registrosHoy.length,

    ausentesHoy: registrosHoy.filter(
      r => r.estado === "ausente"
    ).length,

    porcentaje: todosLosRegistros.value.length
      ? Math.round(
          (asistencias / todosLosRegistros.value.length) * 100
        )
      : 0,

    semana: todosLosRegistros.value.filter(r => {
      const dia = fechaDeRegistro(r);
      return dia >= desde && dia <= hoy;
    }).length,
  };
});

const fondoDonut = computed(() => {
  const total = alumnosDelCurso.value.length;

  if (!total) return "#e8ecf2";

  const colores = [
    ["presente", "#12995b"],
    ["tarde", "#f59e0b"],
    ["ausente", "#ef4444"],
    ["justificado", "#2563eb"],
  ];

  let acumulado = 0;
  const tramos = [];

  colores.forEach(([estado, color]) => {
    const porcentaje = (conteoDia.value[estado] / total) * 100;

    if (porcentaje > 0) {
      tramos.push(
        `${color} ${acumulado}% ${acumulado + porcentaje}%`
      );
      acumulado += porcentaje;
    }
  });

  if (acumulado < 100) {
    tramos.push(`#e8ecf2 ${acumulado}% 100%`);
  }

  return `conic-gradient(${tramos.join(", ")})`;
});

function porcentajeEstado(estado) {
  const total = alumnosDelCurso.value.length;

  return total
    ? Math.round((conteoDia.value[estado] / total) * 100)
    : 0;
}

// --------------------------------------------------
// CARGAR CURSOS REALES
// --------------------------------------------------

async function cargarCursos() {
  const resultado = await obtenerCursos();

  if (!resultado.success) {
    throw new Error(
      resultado.message || "No se pudieron cargar los cursos."
    );
  }

  cursos.value = normalizarLista(resultado)
    .map(normalizarCurso)
    .filter(c => c.id != null);

  if (!cursos.value.length) {
    cursoSeleccionado.value = null;
    alumnosDelCurso.value = [];
    registrosCurso.value = [];
    todosLosRegistros.value = [];
    return;
  }

  const existe = cursos.value.some(
    c => Number(c.id) === Number(cursoSeleccionado.value)
  );

  if (!existe) {
    cursoSeleccionado.value = cursos.value[0].id;
  }
}

// --------------------------------------------------
// CARGAR ALUMNOS Y ASISTENCIAS REALES
// --------------------------------------------------

async function cargarCurso() {
  if (cursoSeleccionado.value == null) {
    alumnosDelCurso.value = [];
    registrosCurso.value = [];
    return;
  }

  cargando.value = true;
  errorCarga.value = "";
  cantidadVisible.value = 6;

  try {
    const idCurso = cursoSeleccionado.value;

    const [
      resultadoAlumnos,
      resultadoCurso,
      resultadoTodas,
    ] = await Promise.all([
      obtenerAlumnosCurso(idCurso, fecha.value),

      // Esta función recibe un objeto de filtros, no el ID directamente.
      obtenerHistorialAsistenciasCurso({
        id_curso: idCurso,
      }),

      obtenerAsistencias(),
    ]);

    if (!resultadoAlumnos.success) {
      throw new Error(
        resultadoAlumnos.message || "No se pudieron cargar los alumnos."
      );
    }

    if (!resultadoCurso.success) {
      throw new Error(
        resultadoCurso.message ||
        "No se pudieron cargar las asistencias del curso."
      );
    }

    alumnosDelCurso.value = normalizarLista(resultadoAlumnos)
      .map(normalizarAlumno)
      .filter(a => a.id_alumno != null);

    registrosCurso.value = normalizarLista(resultadoCurso);

    if (resultadoTodas.success) {
      const idsCursos = new Set(
        cursos.value.map(c => Number(c.id))
      );

      todosLosRegistros.value = normalizarLista(resultadoTodas)
        .filter(r => {
          // Si la respuesta incluye el curso, limitamos los registros
          // a los cursos que el usuario puede consultar.
          if (r.id_curso == null) return true;
          return idsCursos.has(Number(r.id_curso));
        });
    } else {
      // La tabla del curso sigue funcionando aunque falle
      // la consulta secundaria de estadísticas generales.
      todosLosRegistros.value = registrosCurso.value;
    }
  } catch (error) {
    errorCarga.value =
      error.message || "Ocurrió un error al cargar las asistencias.";

    alumnosDelCurso.value = [];
    registrosCurso.value = [];
    todosLosRegistros.value = [];
  } finally {
    cargando.value = false;
  }
}

async function recargar() {
  await cargarCurso();
}

// --------------------------------------------------
// CAMBIAR ESTADO INDIVIDUAL
// --------------------------------------------------

async function cambiarEstado(alumno, estado) {
  if (!estado || guardando.value) return;

  const idUsuario = obtenerIdUsuario();

  if (!idUsuario) {
    mostrarMensaje(
      "No se pudo identificar al usuario autenticado.",
      "err"
    );
    return;
  }

  guardando.value = true;

  try {
    const existente = filasDelDia.value.find(
      f => Number(f.alumno.id_alumno) === Number(alumno.id_alumno)
    )?.registro;

    let resultado;

    if (existente) {
      resultado = await modificarAsistencia({
        id_asistencia: existente.id_asistencia,
        id_alumno: alumno.id_alumno,
        fecha: fecha.value,
        estado,
      });
    } else {
      resultado = await crearAsistencia({
        id_alumno: alumno.id_alumno,
        id_curso: cursoSeleccionado.value,
        fecha: fecha.value,
        estado,
        registrado_por: idUsuario,
      });
    }

    if (!resultado.success) {
      throw new Error(
        resultado.message || "No se pudo guardar la asistencia."
      );
    }

    mostrarMensaje("Asistencia guardada correctamente.");
    await recargar();
  } catch (error) {
    mostrarMensaje(
      error.message || "No se pudo actualizar la asistencia.",
      "err"
    );
  } finally {
    guardando.value = false;
  }
}

// --------------------------------------------------
// TOMAR ASISTENCIA EN LOTE
// --------------------------------------------------

function abrirTomar() {
  if (!alumnosDelCurso.value.length) {
    mostrarMensaje(
      "No hay alumnos cargados para este curso.",
      "err"
    );
    return;
  }

  const nuevos = {};

  filasDelDia.value.forEach(({ alumno, registro }) => {
    nuevos[alumno.id_alumno] = registro?.estado || "presente";
  });

  registrosLote.value = nuevos;
  modalTomar.value = true;
}

function marcarTodos(estado) {
  const nuevos = {};

  alumnosDelCurso.value.forEach(alumno => {
    nuevos[alumno.id_alumno] = estado;
  });

  registrosLote.value = nuevos;
}

async function guardarLote() {
  if (guardando.value) return;

  const idUsuario = obtenerIdUsuario();

  if (!idUsuario) {
    mostrarMensaje(
      "No se pudo identificar al usuario autenticado.",
      "err"
    );
    return;
  }

  guardando.value = true;

  try {
    const registros = Object.entries(registrosLote.value).map(
      ([id, estado]) => ({
        id_alumno: Number(id),
        estado,
      })
    );

    const resultado = await registrarAsistenciasLote({
      registrado_por: idUsuario,
      id_curso: cursoSeleccionado.value,
      fecha: fecha.value,
      registros,
    });

    if (!resultado.success) {
      throw new Error(
        resultado.message || "No se pudieron guardar las asistencias."
      );
    }

    modalTomar.value = false;
    mostrarMensaje("Asistencias registradas correctamente.");
    await recargar();
  } catch (error) {
    mostrarMensaje(
      error.message || "No se pudieron guardar las asistencias.",
      "err"
    );
  } finally {
    guardando.value = false;
  }
}

// --------------------------------------------------
// IMPORTAR CSV O TXT A TRAVÉS DEL BACKEND
// Formato esperado por este importador: id_alumno,estado
// --------------------------------------------------

function abrirImportador() {
  archivoInput.value?.click();
}

async function importarArchivo(evento) {
  const archivo = evento.target.files?.[0];
  evento.target.value = "";

  if (!archivo) return;

  const idUsuario = obtenerIdUsuario();

  if (!idUsuario) {
    mostrarMensaje(
      "No se pudo identificar al usuario autenticado.",
      "err"
    );
    return;
  }

  guardando.value = true;

  try {
    const texto = await archivo.text();

    const registros = texto
      .split(/\r?\n/)
      .map(linea => linea.split(/[;,]/).map(valor => valor.trim()))
      .filter(columnas => columnas.length >= 2)
      .map(([id, estado]) => ({
        id_alumno: Number(id),
        estado: estado.toLowerCase(),
      }))
      .filter(r =>
        r.id_alumno &&
        estados.some(e => e.value === r.estado)
      );

    if (!registros.length) {
      mostrarMensaje(
        "El archivo no contiene filas válidas (id_alumno,estado).",
        "err"
      );
      return;
    }

    const idsDelCurso = new Set(
      alumnosDelCurso.value.map(a => Number(a.id_alumno))
    );

    const validos = registros.filter(
      r => idsDelCurso.has(Number(r.id_alumno))
    );

    if (!validos.length) {
      mostrarMensaje(
        "El archivo no contiene alumnos de este curso.",
        "err"
      );
      return;
    }

    const resultado = await registrarAsistenciasLote({
      registrado_por: idUsuario,
      id_curso: cursoSeleccionado.value,
      fecha: fecha.value,
      registros: validos,
    });

    if (!resultado.success) {
      throw new Error(
        resultado.message || "No se pudo importar el archivo."
      );
    }

    mostrarMensaje(
      `${validos.length} registros enviados correctamente.`
    );

    await recargar();
  } catch (error) {
    mostrarMensaje(
      error.message || "No se pudo importar el archivo.",
      "err"
    );
  } finally {
    guardando.value = false;
  }
}

// --------------------------------------------------
// HISTORIAL REAL
// --------------------------------------------------

async function abrirHistorial(idAlumno = null) {
  alumnoHistorial.value = idAlumno;

  const desde = new Date();
  desde.setDate(desde.getDate() - 30);

  fechaDesde.value = fechaISO(desde);
  fechaHasta.value = fechaHoy();
  modalHistorial.value = true;

  await buscarHistorial();
}

async function buscarHistorial() {
  if (cursoSeleccionado.value == null) {
    historial.value = [];
    return;
  }

  cargandoHistorial.value = true;

  try {
    const resultado = await obtenerHistorialAsistencias({
      id_curso: cursoSeleccionado.value,
      fecha_desde: fechaDesde.value || undefined,
      fecha_hasta: fechaHasta.value || undefined,
    });

    if (!resultado.success) {
      throw new Error(
        resultado.message || "No se pudo cargar el historial."
      );
    }

    historial.value = normalizarLista(resultado);
  } catch (error) {
    historial.value = [];

    mostrarMensaje(
      error.message || "No se pudo cargar el historial.",
      "err"
    );
  } finally {
    cargandoHistorial.value = false;
  }
}

const historialFiltrado = computed(() => {
  if (alumnoHistorial.value == null) return historial.value;

  return historial.value.filter(
    r => Number(r.id_alumno) === Number(alumnoHistorial.value)
  );
});

function nombreRegistro(registro) {
  if (registro.alumno) {
    return nombreCompleto(registro.alumno);
  }

  const alumno = alumnosDelCurso.value.find(
    a => Number(a.id_alumno) === Number(registro.id_alumno)
  );

  if (alumno) return nombreCompleto(alumno);

  // No inventamos un nombre si el historial no trae los datos del alumno.
  return registro.id_alumno != null
    ? `ID de alumno: ${registro.id_alumno}`
    : "Alumno no identificado";
}

// --------------------------------------------------
// OBSERVACIONES
// No existe una función de guardado de observaciones
// en el servicio académico que compartiste.
// --------------------------------------------------

function observacionDe(idAlumno, registro) {
  if (registro?.observaciones) return registro.observaciones;
  if (registro?.observacion) return registro.observacion;

  return "—";
}

function abrirObservacion(idAlumno) {
  alumnoObservacion.value = idAlumno;
  textoObservacion.value = "";
  menuAlumno.value = null;
  modalObservacion.value = true;
}

function guardarObservacion() {
  modalObservacion.value = false;

  mostrarMensaje(
    "Todavía falta conectar las observaciones con el backend.",
    "err"
  );
}

// --------------------------------------------------
// ELIMINAR REGISTRO REAL
// --------------------------------------------------

function alternarMenu(idAlumno) {
  menuAlumno.value = menuAlumno.value === idAlumno ? null : idAlumno;
}

async function eliminarRegistro(alumno) {
  menuAlumno.value = null;

  const registro = filasDelDia.value.find(
    f => Number(f.alumno.id_alumno) === Number(alumno.id_alumno)
  )?.registro;

  if (!registro) {
    mostrarMensaje(
      "Este alumno no tiene un registro para esa fecha.",
      "err"
    );
    return;
  }

  if (!registro.id_asistencia) {
    mostrarMensaje(
      "La API no devolvió el identificador de este registro.",
      "err"
    );
    return;
  }

  if (
    !window.confirm(
      `¿Eliminar la asistencia de ${nombreCompleto(alumno)}?`
    )
  ) {
    return;
  }

  guardando.value = true;

  try {
    const resultado = await eliminarAsistencia(
      registro.id_asistencia
    );

    if (!resultado.success) {
      throw new Error(
        resultado.message || "No se pudo eliminar el registro."
      );
    }

    mostrarMensaje("Registro eliminado correctamente.");
    await recargar();
  } catch (error) {
    mostrarMensaje(
      error.message || "No se pudo eliminar el registro.",
      "err"
    );
  } finally {
    guardando.value = false;
  }
}

// --------------------------------------------------
// FILTROS
// --------------------------------------------------

function filtrarEstado(estado) {
  filtroEstado.value = estado;
  fecha.value = fechaHoy();

  // Si ya estamos en la fecha de hoy, el watcher no se ejecutará.
  if (fecha.value === fechaHoy()) {
    cargarCurso();
  }
}

function limpiarFiltros() {
  filtroEstado.value = "";
  busqueda.value = "";
  mostrarFiltros.value = false;
}

watch(fecha, async (nuevaFecha, fechaAnterior) => {
  cantidadVisible.value = 6;

  if (
    nuevaFecha !== fechaAnterior &&
    cursoSeleccionado.value != null
  ) {
    await cargarCurso();
  }
});

// --------------------------------------------------
// INICIO
// --------------------------------------------------

onMounted(async () => {
  cargando.value = true;
  errorCarga.value = "";

  try {
    await cargarCursos();

    if (cursoSeleccionado.value != null) {
      await cargarCurso();
    }
  } catch (error) {
    errorCarga.value =
      error.message || "No se pudieron cargar los datos iniciales.";
  } finally {
    cargando.value = false;
  }
});
</script>

<style src="../Asistencias.css"></style>
