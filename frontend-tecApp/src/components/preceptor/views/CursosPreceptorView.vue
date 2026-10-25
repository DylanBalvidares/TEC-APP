<template>
  <div class="cursos-view">

    <!-- =========================
         VISTA DE CURSOS
    ========================== -->

    <div class="boletines-header">
      <h1>
        Cursos a cargo
        <HelpPopover
          tipo="popover"
          titulo="Guía de Cursos Asignados"
          icono="fas fa-circle-question"
          icono-titulo="fas fa-school"
          posicion="bottom"
          aria-label="Ayuda sobre cursos asignados"
        >
          <p>Seleccioná <strong>Ver alumnos</strong> para gestionar la nómina del curso (datos de contacto, tutores y matriculación).</p>
          <p style="margin-top: 6px;">Seleccioná <strong>Ver boletines</strong> para consultar las planillas de calificaciones por período.</p>
        </HelpPopover>
      </h1>

      <p>
        Gestioná los cursos asignados: consultá o agregá alumnos y revisá las calificaciones y boletines.
      </p>
    </div>


    <!-- =========================
         CARGANDO
    ========================== -->

    <div
      v-if="cargandoCursos"
      class="mensaje-estado"
    >
      <i class="fas fa-spinner fa-spin"></i>
      Cargando cursos...
    </div>


    <!-- =========================
         ERROR
    ========================== -->

    <div
      v-else-if="errorCursos"
      class="mensaje-estado error"
    >
      <i class="fas fa-circle-exclamation"></i>
      {{ errorCursos }}
    </div>


    <!-- =========================
         SIN CURSOS
    ========================== -->

    <div
      v-else-if="cursos.length === 0"
      class="mensaje-estado"
    >
      <i class="fas fa-school"></i>
      No hay cursos disponibles.
    </div>


    <!-- =========================
         CURSOS
    ========================== -->

    <div
      v-else
      class="cursos-container"
    >

      <div
        v-for="curso in cursos"
        :key="curso.id_curso"
        class="curso-card"
      >

        <!-- Parte superior -->
        <div class="curso-card-top">

          <div class="curso-icon">
            🎓
          </div>

          <span class="curso-turno">
            {{ curso.turno || "Sin turno" }}
          </span>

        </div>


        <!-- Información -->
        <div class="curso-info">

          <h2>
            {{ curso.nombre_curso }}
          </h2>

          <p>
            {{ curso.nivel || "Nivel no especificado" }}
          </p>

        </div>


        <!-- Acciones -->
        <div class="curso-acciones">

          <!-- Administrar alumnos -->
          <button
            class="curso-btn"
            type="button"
            @click="seleccionarCurso(curso)"
          >
            <i class="fas fa-users"></i>
            Ver alumnos
          </button>


          <!-- Consultar boletines -->
          <button
            class="curso-btn curso-btn-boletines"
            type="button"
            @click="verBoletines(curso)"
          >
            <i class="fas fa-file-lines"></i>
            Ver boletines
          </button>

        </div>

      </div>

    </div>

  </div>
</template>


<script setup>

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import HelpPopover from "@/components/ui/HelpPopover.vue";

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
      resultado.message ||
      "No se pudieron obtener los cursos.";

  }

  cargandoCursos.value = false;
};


// ==========================================
//        IR A ADMINISTRAR ALUMNOS
// ==========================================

const seleccionarCurso = (curso) => {

  router.push(
    `/preceptor/alumnos/${curso.id_curso}`
  );

};


// ==========================================
//           IR A BOLETINES
// ==========================================

const verBoletines = (curso) => {

  router.push(
    `/preceptor/boletines/${curso.id_curso}`
  );

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
   ACCIONES DE CADA CURSO
========================================== */

.curso-acciones {

  display: flex;

  flex-direction: column;

  gap: 10px;

  margin-top: 18px;

}


/* ==========================================
   BOTONES
========================================== */

.curso-btn {

  width: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  padding: 11px 16px;

  border: none;

  border-radius: 10px;

  background: #c0152a;

  color: #ffffff;

  font-family: inherit;

  font-size: 13px;

  font-weight: 600;

  cursor: pointer;

  transition:
    background 0.2s ease,
    transform 0.2s ease;

}

.curso-btn:hover {

  background: #a91023;

  transform: translateY(-1px);

}


/* ==========================================
   BOTÓN BOLETINES
========================================== */

.curso-btn-boletines {

  background: #f3e9ff;

  color: #6f3fa3;

}

.curso-btn-boletines:hover {

  background: #e7d5fa;

  color: #5c3188;

}


/* ==========================================
   RESPONSIVE
========================================== */

@media (max-width: 600px) {

  .curso-acciones {

    gap: 8px;

  }

  .curso-btn {

    font-size: 12px;

    padding: 10px 12px;

  }

}

</style>
