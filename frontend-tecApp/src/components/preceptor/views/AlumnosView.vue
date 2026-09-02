```vue
<template>
  <div class="main-content">

    <!-- =========================
         VOLVER
    ========================== -->
    <button
      type="button"
      class="volver-cursos"
      @click="volverCursos"
    >
      <i class="fas fa-arrow-left"></i>
      Volver a cursos
    </button>


    <!-- =========================
         ENCABEZADO
    ========================== -->
    <div class="boletines-header">

      <h1>
        {{ nombreCurso }}
      </h1>

      <p>
        Listado de alumnos
      </p>

    </div>


    <!-- =========================
         BUSCADOR Y FILTRO
    ========================== -->
    <div class="filtros-alumnos">

      <div class="search-box">
        <i class="fas fa-search"></i>

        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar alumno..."
        >
      </div>

      <select v-model="filtroEstado">
        <option value="todos">Todos los estados</option>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>

    </div>


    <!-- =========================
         CARGANDO
    ========================== -->
    <div
      v-if="cargando"
      class="mensaje-estado"
    >
      <i class="fas fa-spinner fa-spin"></i>
      Cargando alumnos...
    </div>


    <!-- =========================
         ERROR
    ========================== -->
    <div
      v-else-if="error"
      class="mensaje-estado error"
    >
      <i class="fas fa-circle-exclamation"></i>
      {{ error }}
    </div>


    <!-- =========================
         SIN RESULTADOS
    ========================== -->
    <div
      v-else-if="alumnosFiltrados.length === 0"
      class="mensaje-estado"
    >
      <i class="fas fa-user-slash"></i>
      No se encontraron alumnos.
    </div>


    <!-- =========================
         LISTADO
    ========================== -->
    <div
      v-else
      class="alumnos-container"
    >

      <!-- ENCABEZADO -->
      <div class="alumnos-header">

        <span>Alumno</span>

        <span>DNI</span>

        <span>Estado</span>

      </div>


      <!-- ALUMNOS -->
      <div
        v-for="alumno in alumnosFiltrados"
        :key="alumno.id_alumno"
        class="alumno-fila"
      >

        <!-- INFORMACIÓN -->
        <div class="alumno-info">

          <div class="alumno-avatar">
            {{ obtenerIniciales(alumno) }}
          </div>

          <strong>
            {{ alumno.apellido }}, {{ alumno.nombre }}
          </strong>

        </div>


        <!-- DNI -->
        <span class="alumno-dni">
          {{ alumno.dni || "—" }}
        </span>


        <!-- ESTADO -->
        <span
          class="alumno-estado"
          :class="obtenerClaseEstado(alumno)"
        >
          {{ obtenerEstado(alumno) }}
        </span>

      </div>

    </div>

  </div>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  obtenerCursos,
  obtenerAlumnosCurso
} from "@/services/academico-service.js";


// ==========================================
//                 ROUTER
// ==========================================

const route = useRoute();
const router = useRouter();


// ==========================================
//                 CURSO
// ==========================================

const idCurso = route.params.idCurso;

const nombreCurso = ref("Curso");


// ==========================================
//                ALUMNOS
// ==========================================

const alumnos = ref([]);

const cargando = ref(false);

const error = ref("");


// ==========================================
//                 FILTROS
// ==========================================

const busqueda = ref("");

const filtroEstado = ref("todos");


// ==========================================
//          OBTENER CURSO
// ==========================================

const cargarNombreCurso = async () => {

  const resultado = await obtenerCursos();

  if (!resultado.success) {
    return;
  }

  const curso = (resultado.data || []).find(
    curso => String(curso.id_curso) === String(idCurso)
  );

  if (curso) {
    nombreCurso.value = curso.nombre_curso;
  }

};


// ==========================================
//          OBTENER ALUMNOS
// ==========================================

const cargarAlumnos = async () => {

  cargando.value = true;

  error.value = "";

  const resultado = await obtenerAlumnosCurso(idCurso);

  if (resultado.success) {

    alumnos.value = resultado.data || [];

  } else {

    error.value =
      resultado.message ||
      "No se pudieron obtener los alumnos.";

  }

  cargando.value = false;

};


// ==========================================
//              FILTRAR
// ==========================================

const alumnosFiltrados = computed(() => {

  let resultado = [...alumnos.value];


  // BUSCADOR

  const texto = busqueda.value
    .trim()
    .toLowerCase();

  if (texto) {

    resultado = resultado.filter(alumno => {

      const nombre =
        `${alumno.nombre || ""} ${alumno.apellido || ""}`
          .toLowerCase();

      const dni =
        String(alumno.dni || "").toLowerCase();

      return (
        nombre.includes(texto) ||
        dni.includes(texto)
      );

    });

  }


  // FILTRO DE ESTADO

  if (filtroEstado.value !== "todos") {

    resultado = resultado.filter(alumno => {

      return (
        String(alumno.estado || "")
          .toLowerCase() === filtroEstado.value
      );

    });

  }


  return resultado;

});


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
//                 ESTADO
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
//              VOLVER
// ==========================================

const volverCursos = () => {

  router.push("/preceptor/cursos");

};


// ==========================================
//             AL CARGAR
// ==========================================

onMounted(() => {

  cargarNombreCurso();

  cargarAlumnos();

});
</script>


<style scoped>

/* ==========================================
   VOLVER
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
   FILTROS
========================================== */

.filtros-alumnos {

  display: flex;

  align-items: center;

  gap: 15px;

  margin-bottom: 20px;

}


.filtros-alumnos .search-box {

  flex: 1;

  max-width: 500px;

}


.filtros-alumnos select {

  padding: 11px 15px;

  border: none;

  border-radius: 25px;

  background: white;

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

  color: #555;

  outline: none;

  cursor: pointer;

}


/* ==========================================
   LISTADO
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
   MENSAJES
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
   RESPONSIVE
========================================== */

@media (max-width: 800px) {

  .filtros-alumnos {

    flex-direction: column;

    align-items: stretch;

  }

  .filtros-alumnos .search-box {

    max-width: none;

    width: 100%;

  }

  .filtros-alumnos select {

    width: 100%;

  }


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
