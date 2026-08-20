<template>
  <div class="cursos-wrapper">
    <div v-if="vistaActiva === 'lista'" class="search-bar-wrapper">
      <div class="search-box">
        <i class="ti ti-search"></i>
        <input v-model="searchText" type="text" placeholder="Buscar curso por nombre, nivel o turno..." aria-label="Buscar cursos" />
        <button v-if="searchText" class="search-clear" @click="searchText = ''; goToPage(1)" aria-label="Limpiar búsqueda"><i class="ti ti-x"></i></button>
      </div>
    </div>

    <div v-if="vistaActiva === 'lista'" class="card animate-fade-in">
      <div class="card-header">
        <div class="card-title"><i class="ti ti-book" aria-hidden="true"></i> Cursos registrados</div>
        <div class="card-header-actions">
          <label class="toggle-finalizados" title="Mostrar cursos finalizados o cancelados">
            <input type="checkbox" v-model="mostrarFinalizados" />
            <span class="toggle-label">Ver finalizados</span>
          </label>
          <button @click="cambiarVista('crear')" class="tb-btn primary sm"><i class="ti ti-plus" aria-hidden="true"></i> Nuevo</button>
        </div>
      </div>

      <div class="table-responsive">
        <div v-if="cargando" class="empty-state">
          <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
          <p>Cargando cursos...</p>
        </div>

        <div v-else-if="errorCarga" class="error-banner" style="margin: 16px">
          <i class="ti ti-alert-circle"></i> {{ errorCarga }}
          <button class="tb-btn sm outline" @click="fetchCursos" style="margin-left: auto">Reintentar</button>
        </div>                <template v-else-if="filteredData.length > 0">
                  <table class="mini" aria-label="Cursos registrados">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Nivel</th>
              <th>Aula</th>
              <th>Turno</th>
              <th>Estado</th>
              <th class="action-cell">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="curso in paginatedData" :key="curso.id_curso" class="table-row">
              <td style="font-weight: 500">
                {{ curso.nombre_curso }}
              </td>
              <td>{{ curso.nivel }}</td>
              <td>{{ curso.aula }}</td>
              <td>
                <span :class="['badge', badgeClass(curso.turno)]">
                  {{ curso.turno }}
                </span>
              </td>
              <td>
                <span :class="['estado-dot', curso.estado]"></span>
                {{ curso.estado }}
              </td>
              <td class="action-cell">
                <div class="action-buttons">
                  <button @click="cambiarVista('detalles', curso)" class="icon-btn view" title="Ver detalles" aria-label="Ver detalles">
                    <i class="ti ti-eye"></i>
                  </button>
                  <button @click="cambiarVista('editar', curso)" class="icon-btn edit" title="Editar" aria-label="Editar">
                    <i class="ti ti-edit"></i>
                  </button>
                  <button @click="pedirConfirmacion(curso)" class="icon-btn delete" title="Eliminar" aria-label="Eliminar">
                    <i class="ti ti-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
                  </template>

        <div v-else class="empty-state">
          <i class="ti ti-inbox" style="font-size: 28px; opacity: 0.4"></i>
          <p v-if="searchText">No se encontraron cursos que coincidan con "{{ searchText }}".</p>
          <p v-else>No hay cursos registrados todavía.</p>
        </div>
      </div>
                  <Pagination
                    :current-page="currentPage"
                    :total-items="totalItems"
                    :page-size="pageSize"
                    @page-change="goToPage"
                    @page-size-change="setPageSize"
                  />
    </div>

    <div v-if="vistaActiva === 'detalles' && cursoSeleccionado" class="card animate-fade-in">
      <div class="card-header">
        <div class="card-title">
          <i class="ti ti-info-circle"></i>
          {{ cursoSeleccionado.nombre_curso }} ({{ cursoSeleccionado.ciclo_lectivo }})
        </div>
        <button @click="cambiarVista('lista')" class="icon-btn" aria-label="Volver">
          <i class="ti ti-arrow-left"></i>
        </button>
      </div>

      <div class="card-body details-view">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Nivel</span>
            <span class="detail-value">{{ cursoSeleccionado.nivel }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Estado</span>
            <span class="detail-value" style="text-transform: capitalize">
              <span :class="['estado-dot', cursoSeleccionado.estado]" style="margin-right: 4px"></span>
              {{ cursoSeleccionado.estado }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Aula asignada</span>
            <span class="detail-value">{{ cursoSeleccionado.aula }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Turno</span>
            <span :class="['badge', badgeClass(cursoSeleccionado.turno)]">
              {{ cursoSeleccionado.turno }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Capacidad Máxima</span>
            <span class="detail-value">{{ cursoSeleccionado.capacidad_maxima || "No definida" }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">ID Profesor Titular</span>
            <span class="detail-value"
              >{{ cursoSeleccionado.profesorTitular?.apellido }}
              {{ cursoSeleccionado.profesorTitular?.nombre }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">ID interno</span>
            <span class="detail-value mono">#{{ cursoSeleccionado.id_curso }}</span>
          </div>
        </div>

        <div class="alumnos-section">
          <h4
            class="section-subtitle"
            style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px"
          >
            <i class="ti ti-users"></i> Alumnos inscritos
          </h4>

          <div v-if="cargandoAlumnos" class="empty-state" style="padding: 20px">
            <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
            <p>Cargando lista de alumnos...</p>
          </div>

          <div v-else-if="errorAlumnos" class="error-banner" style="margin-top: 10px">
            <i class="ti ti-alert-circle"></i> {{ errorAlumnos }}
            <button class="tb-btn sm outline" @click="fetchAlumnos(cursoSeleccionado.id_curso)" style="margin-left: auto">
              Reintentar
            </button>
          </div>

          <table v-else-if="alumnosCurso.length > 0" class="mini" style="margin-top: 10px">
            <thead>
              <tr>
                <th>ID</th>
                <th>Alumno</th>
                <th>Contacto / Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="alumno in alumnosCurso" :key="alumno.id_alumno" class="table-row">
                <td class="mono" style="color: #6b7280">#{{ alumno.id_alumno }}</td>
                <td>
                  <div style="font-weight: 500; color: #111827">
                    {{ alumno.nombre }}
                    {{ alumno.apellido }}
                  </div>
                  <div style="font-size: 11px; color: #6b7280">Legajo: {{ alumno.legajo || "S/N" }}</div>
                </td>
                <td>
                  {{ alumno.telefono_tutor || "Sin registro" }}
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="empty-state" style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-top: 10px">
            <i class="ti ti-user-off" style="font-size: 24px; opacity: 0.4"></i>
            <p>Este curso no tiene alumnos inscritos actualmente.</p>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <button @click="cambiarVista('lista')" class="tb-btn outline">Cerrar</button>
        <button @click="cambiarVista('editar', cursoSeleccionado)" class="tb-btn primary"><i class="ti ti-edit"></i> Editar</button>
      </div>
    </div>

    <div v-if="['crear', 'editar'].includes(vistaActiva)" class="card animate-fade-in">
      <div class="card-header">
        <div class="card-title">
          <i :class="vistaActiva === 'crear' ? 'ti ti-plus' : 'ti ti-edit'"></i>
          {{ vistaActiva === "crear" ? "Nuevo curso" : "Editar curso" }}
        </div>
        <button @click="cambiarVista('lista')" class="icon-btn" aria-label="Volver">
          <i class="ti ti-arrow-left"></i>
        </button>
      </div>

      <form @submit.prevent="guardarCurso" class="form-body">
        <div class="form-row">
          <div class="form-group">
            <label for="nombre_curso">Nombre del curso <span class="required">*</span></label>
            <input id="nombre_curso" ref="primerInputRef" v-model="form.nombre_curso" type="text" placeholder="Ej: 1°A" :class="{ 'input-error': erroresForm.nombre_curso }" @blur="validarCampo('nombre_curso')" required />
            <span v-if="erroresForm.nombre_curso" class="field-error">{{ erroresForm.nombre_curso }}</span>
          </div>
          <div class="form-group">
            <label for="nivel">Nivel <span class="required">*</span></label>
            <select id="nivel" v-model="form.nivel" :class="{ 'input-error': erroresForm.nivel }" @blur="validarCampo('nivel')" required>
              <option value="" disabled>Seleccionar...</option>
              <option v-for="n in niveles" :key="n" :value="n">
                {{ n }}
              </option>
            </select>
            <span v-if="erroresForm.nivel" class="field-error">{{ erroresForm.nivel }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="ciclo_lectivo">Ciclo Lectivo (Año) <span class="required">*</span></label>
            <input id="ciclo_lectivo" v-model="form.ciclo_lectivo" type="number" :class="{ 'input-error': erroresForm.ciclo_lectivo }" @blur="validarCampo('ciclo_lectivo')" required />
            <span v-if="erroresForm.ciclo_lectivo" class="field-error">{{ erroresForm.ciclo_lectivo }}</span>
          </div>
          <div class="form-group">
            <label for="estado">Estado</label>
            <select id="estado" v-model="form.estado" required>
              <option value="activo">Activo</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="aula">Aula <span class="required">*</span></label>
            <input id="aula" v-model="form.aula" type="text" placeholder="Ej: 101" :class="{ 'input-error': erroresForm.aula }" @blur="validarCampo('aula')" required />
            <span v-if="erroresForm.aula" class="field-error">{{ erroresForm.aula }}</span>
          </div>
          <div class="form-group">
            <label for="turno">Turno <span class="required">*</span></label>
            <select id="turno" v-model="form.turno" :class="{ 'input-error': erroresForm.turno }" @blur="validarCampo('turno')" required>
              <option value="" disabled>Seleccionar...</option>
              <option v-for="t in turnos" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
            <span v-if="erroresForm.turno" class="field-error">{{ erroresForm.turno }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="capacidad_maxima">Capacidad Máxima (Alumnos)</label>
            <input id="capacidad_maxima" v-model="form.capacidad_maxima" type="number" min="1" placeholder="Opcional" :class="{ 'input-error': erroresForm.capacidad_maxima }" @blur="validarCampo('capacidad_maxima')" />
            <span v-if="erroresForm.capacidad_maxima" class="field-error">{{ erroresForm.capacidad_maxima }}</span>
          </div>

          <div class="form-group">
            <label for="id_profesor">Profesor Titular</label>
            <select id="id_profesor" v-model="form.id_profesor_titular">
              <option :value="null">Sin asignar</option>
              <option v-for="profesor in profesoresDisponibles" :key="profesor.id_profesor" :value="profesor.id_profesor">
                {{ profesor.nombre }}, {{ profesor.apellido }}
              </option>
            </select>
          </div>
        </div>

        <div class="card-footer" style="padding-left: 0; padding-right: 0; background: transparent; margin-top: 10px">
          <div v-if="errorGuardar" class="error-banner"><i class="ti ti-alert-circle"></i> {{ errorGuardar }}</div>
          <div v-if="exitoGuardar" class="exito-banner"><i class="ti ti-check"></i> Curso guardado correctamente.</div>
          <button type="button" @click="cambiarVista('lista')" class="tb-btn outline">Cancelar</button>
          <button type="submit" class="tb-btn primary" :disabled="guardando">
            <i class="ti ti-loader animate-spin" v-if="guardando"></i>
            {{ guardando ? "Guardando..." : vistaActiva === "crear" ? "Guardar curso" : "Actualizar curso" }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="cursoAEliminar" class="modal-overlay" @click.self="cursoAEliminar = null">
      <div class="modal-card animate-fade-in">
        <div class="modal-header">
          <i class="ti ti-alert-triangle" style="color: #cd322c; font-size: 20px"></i>
          <h3>Eliminar curso</h3>
        </div>

        <p class="modal-body">
          ¿Seguro que querés cancelar el curso
          <strong>{{ cursoAEliminar.nombre_curso }}</strong
          > ({{ cursoAEliminar.nivel }} — {{ cursoAEliminar.turno }})? El curso quedará marcado como
          <strong>"Cancelado"</strong> y no aparecerá en listas activas, pero sus alumnos,
          asignaciones e historial se preservarán. Podés reactivarlo después editando su ficha.
        </p>

        <div v-if="errorEliminar" class="error-banner" style="margin-bottom: 16px; width: 100%; box-sizing: border-box">
          <i class="ti ti-alert-circle"></i> {{ errorEliminar }}
        </div>

        <div class="modal-footer">
          <button class="tb-btn outline" @click="cursoAEliminar = null">Cancelar</button>
          <button class="tb-btn danger" @click="confirmarEliminar" :disabled="eliminando">
            <i class="ti ti-loader animate-spin" v-if="eliminando"></i>
            {{ eliminando ? "Cancelando..." : "Sí, cancelar curso" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import {
  obtenerCursos,
  obtenerAlumnosCurso,
  crearCurso,
  modificarCurso,
  cancelarCurso,
  obtenerProfesores,
} from "../../../services/academico-service.js";
import {
  validarRequerido,
  validarAnioLectivo,
  validarNumeroPositivo,
  validarFormulario,
} from "../../../utils/validators.js";
import { useTableControls } from "../../../composables/useTableControls.js";
import Pagination from "../../ui/Pagination.vue";

// ── Opciones de Selects ────────────────────────────────────────────────────
const turnos = ["8:00 a 15:25", "12:00 a 19:00", "8:00 a 12:00", "13:15 a 17:45", "13:15 a 19:00"];

// Podés modificar esto según los niveles que maneje la escuela
const niveles = ["Ciclo basico", "Ciclo superior"];

// ── Estado ──────────────────────────────────────────────────────────────────
const cursos = ref([]);
const profesoresDisponibles = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const eliminando = ref(false);
const vistaActiva = ref("lista");
const cursoSeleccionado = ref(null);
const cursoAEliminar = ref(null);
const errorEliminar = ref("");

const errorCarga = ref("");
const errorGuardar = ref("");
const exitoGuardar = ref(false);

const alumnosCurso = ref([]);
const cargandoAlumnos = ref(false);
const errorAlumnos = ref("");

// ── Filtros y Paginación ────────────────────────────────────────────────
const mostrarFinalizados = ref(false);

const filterFn = (item, q) => {
  // Si no se están mostrando finalizados/cancelados, ocultarlos
  if (!mostrarFinalizados.value && (item.estado === "finalizado" || item.estado === "cancelado")) return false;
  const texto = `${item.nombre_curso} ${item.nivel} ${item.aula} ${item.turno} ${item.estado}`.toLowerCase();
  return texto.includes(q);
};
const {
  searchText,
  currentPage,
  pageSize,
  filteredData,
  paginatedData,
  totalItems,
  goToPage,
  setPageSize,
} = useTableControls(cursos, { pageSize: 10, filterFn });

// ── Refs para autofocus ──────────────────────────────────────────────
const primerInputRef = ref(null);

// ── Inicialización de Formulario ──────────────────────────────────────────
const formVacio = () => ({
  id_curso: null,
  nombre_curso: "",
  nivel: "",
  ciclo_lectivo: new Date().getFullYear(), // Por defecto el año actual
  capacidad_maxima: null,
  aula: "",
  turno: "",
  id_profesor_titular: null,
  estado: "activo", // Por defecto activo
});
const form = ref(formVacio());

// ── Validación ────────────────────────────────────────────────────────────────
const erroresForm = ref({});

const REGLAS_VALIDACION = {
  nombre_curso: (v) => validarRequerido(v, "El nombre del curso"),
  nivel: (v) => validarRequerido(v, "El nivel"),
  ciclo_lectivo: validarAnioLectivo,
  aula: (v) => validarRequerido(v, "El aula"),
  turno: (v) => validarRequerido(v, "El turno"),
  capacidad_maxima: (v) => v ? validarNumeroPositivo(v, "La capacidad máxima") : "",
};

function validarCampo(campo) {
  if (REGLAS_VALIDACION[campo]) {
    erroresForm.value[campo] = REGLAS_VALIDACION[campo](form.value[campo]);
  }
}

function validarTodo() {
  erroresForm.value = validarFormulario(form.value, REGLAS_VALIDACION);
  return Object.keys(erroresForm.value).length === 0;
}

function limpiarErrores() {
  erroresForm.value = {};
}

// ── Funciones de Alumnos ──────────────────────────────────────────────────
const fetchAlumnos = async (idCurso) => {
  cargandoAlumnos.value = true;
  errorAlumnos.value = "";

  const cursoId = (typeof idCurso === 'object' && idCurso !== null)
    ? (idCurso.id_curso || idCurso.id || idCurso.cursoId)
    : idCurso;

  if (!cursoId) {
    console.warn('fetchAlumnos: id de curso inválido recibido', idCurso);
    errorAlumnos.value = 'Id de curso inválido';
    alumnosCurso.value = [];
    cargandoAlumnos.value = false;
    return;
  }

  const res = await obtenerAlumnosCurso(cursoId);

  if (!res.success) {
    errorAlumnos.value = res.message;
    alumnosCurso.value = [];
  } else {
    alumnosCurso.value = Array.isArray(res.data) ? res.data : [];
  }

  cargandoAlumnos.value = false;
};

const fetchProfesores = async () => {
  const res = await obtenerProfesores();

  if (!res.success) {
    profesoresDisponibles.value = [];
    return;
  }

  profesoresDisponibles.value = Array.isArray(res.data) ? res.data : [];
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const badgeClass = (turno = "") => {
  const hora = parseInt(turno.trim().split(":")[0], 10);
  if (isNaN(hora)) return "noche";
  if (hora < 12) return "manana";
  return "tarde";
};

// ── Navegación entre vistas ──────────────────────────────────────────────────
const cambiarVista = (nuevaVista, curso = null) => {
  vistaActiva.value = nuevaVista;
  errorGuardar.value = "";
  exitoGuardar.value = false;

  if (nuevaVista === "editar" && curso) {
    form.value = { ...curso };
    limpiarErrores();
  } else if (nuevaVista === "crear") {
    form.value = formVacio();
    limpiarErrores();
    nextTick(() => primerInputRef.value?.focus());
  } else if (nuevaVista === "detalles" && curso) {
    cursoSeleccionado.value = curso;
    fetchAlumnos(curso.id_curso);
  }
};

// ── CRUD ─────────────────────────────────────────────────────────────────────
const fetchCursos = async () => {
  /*
  cargando.value = true;
    errorCarga.value = "";

    const res = await obtenerCursos();

    if (!res.success) {
        // Si el error es el 404 de "no se encontraron cursos", lo tratamos como estado vacío
        if (res.message && res.message.toLowerCase().includes("encontraron")) {
            cursos.value = [];
        } else {
            // Si es un error real (ej. 500 o sin conexión), sí mostramos el banner rojo
            errorCarga.value = res.message;
            cursos.value = [];
        }
    } else {
        cursos.value = Array.isArray(res.data) ? res.data : [];
    }

    cargando.value = false;
*/
  cargando.value = true;
  errorCarga.value = "";
  try {
    const res = await obtenerCursos();
    // Soporta tanto si el array viene directo en res o dentro de res.data
    const data = res?.data || res;
    cursos.value = Array.isArray(data) ? data : [];
  } catch (error) {
    errorCarga.value =
      error?.response?.data?.message ||
      error?.response?.data?.mensaje ||
      error?.message ||
      "Error crítico de red al listar todos los cursos.";
  } finally {
    cargando.value = false;
  }
};

const guardarCurso = async () => {
  errorGuardar.value = "";
  exitoGuardar.value = false;

  if (!validarTodo()) return;

  guardando.value = true;

  form.value.ciclo_lectivo = parseInt(form.value.ciclo_lectivo);
  form.value.capacidad_maxima = form.value.capacidad_maxima ? parseInt(form.value.capacidad_maxima) : null;
  form.value.id_profesor_titular = form.value.id_profesor_titular ? parseInt(form.value.id_profesor_titular) : null;

  let res;

  if (vistaActiva.value === "crear") {
    res = await crearCurso(form.value);
  } else {
    res = await modificarCurso(form.value);
  }

  if (!res.success) {
    errorGuardar.value = res.message;
    guardando.value = false;
    return;
  }

  exitoGuardar.value = true;
  await fetchCursos();

  setTimeout(() => {
    cambiarVista("lista");
  }, 800);

  guardando.value = false;
};

const pedirConfirmacion = (curso) => {
  cursoAEliminar.value = curso;
  errorEliminar.value = "";
};

const confirmarEliminar = async () => {
  eliminando.value = true;
  errorEliminar.value = "";

  const res = await cancelarCurso(cursoAEliminar.value.id_curso);

  if (!res.success) {
    errorEliminar.value = res.message;
    eliminando.value = false;
    return;
  }

  await fetchCursos();
  cursoAEliminar.value = null;
  eliminando.value = false;
};
//onMounted(fetchCursos);
onMounted(() => {
  fetchCursos();
  fetchProfesores();
});
</script>

<style scoped>
/* Agregamos una clase para un indicador visual de estado del curso */
.estado-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.estado-dot.activo {
  background-color: #10b981;
}
.estado-dot.finalizado {
  background-color: #6b7280;
}
.estado-dot.cancelado {
  background-color: #ef4444;
}

/* El resto de tus estilos se mantienen intactos */
.animate-fade-in {
  animation: fadeIn 0.25s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.cursos-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
}

.card {
  background: var(--color-background-primary, #fff);
  border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}
.card-body {
  padding: 20px;
}
.card-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-title i {
  font-size: 16px;
  color: #cd322c;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  padding: 16px;
}
.mini {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.mini th {
  text-align: left;
  padding: 8px 10px;
  color: var(--color-text-tertiary, #6b7280);
  font-weight: 500;
  font-size: 12px;
  border-bottom: 1px solid #e5e7eb;
}
.mini td {
  padding: 10px;
  border-bottom: 0.5px solid #e5e7eb;
  color: var(--color-text-primary, #111827);
  vertical-align: middle;
}
.table-row:hover {
  background: var(--color-background-secondary, #f9fafb);
}

.badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}
.badge.manana {
  background: #e0f2fe;
  color: #0369a1;
}
.badge.tarde {
  background: #fef08a;
  color: #a16207;
}
.badge.noche {
  background: #e5e7eb;
  color: #374151;
}

.action-cell {
  text-align: right;
  width: 110px;
  vertical-align: middle;
}
.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 4px;
  justify-content: flex-end;
  align-items: center;
}
.icon-btn {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  color: #4b5563;
  font-size: 15px;
  padding: 0;
}
.icon-btn i {
  pointer-events: none;
}
.icon-btn:hover {
  background: #f3f4f6;
}
.icon-btn.view:hover {
  background: #f0f9ff;
  border-color: #bae6fd;
  color: #0284c7;
}
.icon-btn.edit:hover {
  background: #f3f4f6;
  color: #111827;
}
.icon-btn.delete:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #ef4444;
}

.tb-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.tb-btn.primary {
  background: #cd322c;
  color: #fff;
  border-color: #cd322c;
}
.tb-btn.primary:hover {
  background: #a52420;
}
.tb-btn.outline {
  background: white;
  color: #4b5563;
  border-color: #d1d5db;
}
.tb-btn.outline:hover {
  background: #f9fafb;
  color: #111827;
}
.tb-btn.danger {
  background: #cd322c;
  color: white;
}
.tb-btn.danger:hover {
  background: #a52420;
}
.tb-btn.sm {
  padding: 6px 12px;
  font-size: 12px;
}
.tb-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}
.form-group input,
.form-group select {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.form-group input:focus,
.form-group select:focus {
  border-color: #cd322c;
  box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.1);
}
.input-error {
  border-color: #ef4444 !important;
}
.field-error {
  font-size: 11px;
  color: #ef4444;
  margin-top: 2px;
}
.required {
  color: #cd322c;
  margin-left: 2px;
}

.details-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}
.detail-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 600;
}
.detail-value {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}
.detail-value.mono {
  font-family: monospace;
  color: #6b7280;
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 12px;
  border-radius: 8px;
  color: #1e3a8a;
  font-size: 12px;
}
.info-box i {
  font-size: 16px;
  color: #3b82f6;
  margin-top: 1px;
}

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
  margin-right: auto;
}
.exito-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #eaf3de;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-right: auto;
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

/* ── Toggle de finalizados ─────────────────────────────────────────── */
.card-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}
.toggle-finalizados {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    cursor: pointer;
    color: #6b7280;
    padding: 4px 8px;
    border-radius: 5px;
    border: 1px solid #e5e7eb;
    transition: all 0.12s;
    user-select: none;
}
.toggle-finalizados:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
}
.toggle-finalizados input[type="checkbox"] {
    margin: 0;
    accent-color: #cd322c;
}
.toggle-label {
    font-weight: 500;
}

/* ── Toolbar de búsqueda ─────────────────────────────────────────────────── */
.search-bar-wrapper {
    margin-bottom: 12px;
}
.search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0 12px;
    background: white;
    transition: border-color 0.15s, box-shadow 0.15s;
    max-width: 400px;
}
.search-box:focus-within {
    border-color: #cd322c;
    box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.08);
}
.search-box i {
    color: #9ca3af;
    font-size: 16px;
    flex-shrink: 0;
}
.search-box input {
    border: none;
    outline: none;
    padding: 8px 0;
    font-size: 13px;
    flex: 1;
    background: transparent;
    color: #111827;
}
.search-box input::placeholder {
    color: #9ca3af;
}
.search-clear {
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 4px;
    display: flex;
    align-items: center;
    border-radius: 4px;
}
.search-clear:hover {
    color: #4b5563;
    background: #f3f4f6;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.modal-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}
.modal-body {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 20px;
  line-height: 1.6;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
