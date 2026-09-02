```vue
<template>
  <div class="cursos-view">

    <!-- =========================
         VISTA DE CURSOS
    ========================== -->
    <template v-if="!cursoSeleccionado">

      <div class="boletines-header">
        <h1>Cursos</h1>
        <p>Seleccioná un curso para ver el listado de alumnos.</p>
      </div>

      <!-- Cargando -->
      <div v-if="cargandoCursos" class="mensaje-estado">
        <i class="fas fa-spinner fa-spin"></i>
        Cargando cursos...
      </div>

      <!-- Error -->
      <div v-else-if="errorCursos" class="mensaje-estado error">
        <i class="fas fa-circle-exclamation"></i>
        {{ errorCursos }}
      </div>

      <!-- Sin cursos -->
      <div v-else-if="cursos.length === 0" class="mensaje-estado">
        <i class="fas fa-school"></i>
        No hay cursos disponibles.
      </div>

      <!-- Cursos -->
      <div v-else class="cursos-container">

        <div
          v-for="curso in cursos"
          :key="curso.id_curso"
          class="curso-card"
        >

          <div class="curso-card-top">

            <div class="curso-icon">
              🎓
            </div>

            <span class="curso-turno">
              {{ curso.turno || "Sin turno" }}
            </span>

          </div>

          <div class="curso-info">

            <h2>
              {{ curso.nombre_curso }}
            </h2>

            <p>
              {{ curso.nivel || "Nivel no especificado" }}
            </p>

          </div>

          <button
            class="curso-btn"
            type="button"
            @click="seleccionarCurso(curso)"
          >
            Ver alumnos
            <i class="fas fa-arrow-right"></i>
          </button>

        </div>

      </div>

    </template>


    <!-- =========================
         VISTA DE ALUMNOS
    ========================== -->
    <template v-else>

      <button
        type="button"
        class="volver-cursos"
        @click="volverCursos"
      >
        <i class="fas fa-arrow-left"></i>
        Volver a cursos
      </button>


      <div class="boletines-header">

        <h1>
          {{ cursoSeleccionado.nombre_curso }}
        </h1>

        <p>
          Listado de alumnos
        </p>

      </div>


      <!-- Cargando alumnos -->
      <div v-if="cargandoAlumnos" class="mensaje-estado">
        <i class="fas fa-spinner fa-spin"></i>
        Cargando alumnos...
      </div>


      <!-- Error alumnos -->
      <div v-else-if="errorAlumnos" class="mensaje-estado error">
        <i class="fas fa-circle-exclamation"></i>
        {{ errorAlumnos }}
      </div>


      <!-- Sin alumnos -->
      <div v-else-if="alumnos.length === 0" class="mensaje-estado">
        <i class="fas fa-user-slash"></i>
        No hay alumnos registrados en este curso.
      </div>


      <!-- Lista de alumnos -->
      <div v-else class="alumnos-container">

        <div class="alumnos-header">
          <span>Alumno</span>
          <span>DNI</span>
          <span>Estado</span>
        </div>


        <div
          v-for="alumno in alumnos"
          :key="alumno.id_alumno"
          class="alumno-fila"
        >

          <div class="alumno-info">

            <div class="alumno-avatar">
              {{ obtenerIniciales(alumno) }}
            </div>

            <div>
              <strong>
                {{ alumno.apellido }}, {{ alumno.nombre }}
              </strong>
            </div>

          </div>


          <span class="alumno-dni">
            {{ alumno.dni || "—" }}
          </span>


          <span
            class="alumno-estado"
            :class="obtenerClaseEstado(alumno)"
          >
            {{ obtenerEstado(alumno) }}
          </span>

        </div>

      </div>

    </template>

  </div>
</template>

<script setup>

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";


import {
  obtenerCursos
} from "@/services/academico-service.js";

const router = useRouter();

// ==========================================
//                 CURSOS
// ==========================================

const cursos = ref([]);

const cargandoCursos = ref(false);
const errorCursos = ref("");



// ==========================================
//             OBTENER CURSOS
// ==========================================

const cargarCursos = async () => {

  cargandoCursos.value = true;
  errorCursos.value = "";

  const resultado = await obtenerCursos();

  if (resultado.success) {

    cursos.value = resultado.data || [];

  } else {

    errorCursos.value =
      resultado.message || "No se pudieron obtener los cursos.";

  }

  cargandoCursos.value = false;
};


// ==========================================
//          SELECCIONAR UN CURSO
// ==========================================

const seleccionarCurso = (curso) => {
  router.push(`/preceptor/alumnos/${curso.id_curso}`);
}



// ==========================================
//             VOLVER A CURSOS
// ==========================================

const volverCursos = () => {

  cursoSeleccionado.value = null;

  alumnos.value = [];

  errorAlumnos.value = "";

};


// ==========================================
//               INICIALES
// ==========================================

const obtenerIniciales = (alumno) => {

  const nombre = alumno.nombre || "";
  const apellido = alumno.apellido || "";

  return (
    nombre.charAt(0) +
    apellido.charAt(0)
  ).toUpperCase();

};


// ==========================================
//                ESTADO
// ==========================================

const obtenerEstado = (alumno) => {

  if (alumno.estado) {
    return alumno.estado;
  }

  return "—";

};


const obtenerClaseEstado = (alumno) => {

  if (!alumno.estado) {
    return "";
  }

  return alumno.estado
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-");

};


// ==========================================
//             AL CARGAR LA VISTA
// ==========================================

onMounted(() => {

  cargarCursos();

});
</script>


<style scoped>
/* ==========================================
   MENSAJES DE ESTADO
========================================== */

.mensaje-estado {
  padding: 50px 20px;
  text-align: center;
  color: #777;
  font-size: 15px;
}

.mensaje-estado i {
  margin-right: 8px;
}

.mensaje-estado.error {
  color: #c0152a;
}


/* ==========================================
   VOLVER A CURSOS
========================================== */

.volver-cursos {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 0;
  margin-bottom: 25px;

  border: none;
  background: transparent;

  color: #666;

  font-family: inherit;
  font-size: 14px;
  font-weight: 600;

  text-decoration: underline;
  text-underline-offset: 4px;

  cursor: pointer;

  transition: color 0.2s ease;
}

.volver-cursos:hover {
  color: #c0152a;
}


/* ==========================================
   LISTADO DE ALUMNOS
========================================== */

.alumnos-container {
  width: 100%;

  background: #ffffff;

  border-radius: 18px;

  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

  overflow: hidden;
}


.alumnos-header,
.alumno-fila {
  display: grid;

  grid-template-columns:
    minmax(250px, 1.5fr)
    1fr
    150px;

  align-items: center;

  gap: 20px;
}


.alumnos-header {
  padding: 15px 22px;

  background: #f7f7f7;

  color: #777;

  font-size: 12px;
  font-weight: 700;

  text-transform: uppercase;
}


.alumno-fila {
  padding: 16px 22px;

  border-top: 1px solid #eeeeee;
}


.alumno-info {
  display: flex;
  align-items: center;
  gap: 12px;
}


.alumno-avatar {
  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #f0e3ff;

  color: #6f3fa3;

  font-size: 13px;
  font-weight: 700;

  flex-shrink: 0;
}


.alumno-info strong {
  font-size: 14px;
  color: #333;
}


.alumno-dni {
  color: #777;
  font-size: 14px;
}


.alumno-estado {
  justify-self: start;

  padding: 6px 11px;

  border-radius: 20px;

  background: #f5f5f5;

  color: #777;

  font-size: 12px;
  font-weight: 600;
}


/* ==========================================
   RESPONSIVE
========================================== */

@media (max-width: 800px) {

  .alumnos-header {
    display: none;
  }

  .alumno-fila {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .alumno-estado {
    justify-self: start;
  }

}
</style>
```
