<template>

  <div class="boletines-page">

    <main class="boletines-contenido">


      <!-- =====================================
           VOLVER
      ====================================== -->

      <button
        class="volver-cursos-btn"
        type="button"
        @click="volverCursos"
      >

        <i class="fa-solid fa-arrow-left"></i>

        Volver a cursos

      </button>


      <!-- =====================================
           ENCABEZADO
      ====================================== -->

      <header class="boletines-header">

        <div>

          <h1>
            Boletines
          </h1>

          <p>

            Consultá los boletines de los alumnos del curso

            <strong>
              {{ cursoNombre }}
            </strong>.

          </p>

        </div>

      </header>


      <!-- =====================================
           ERROR
      ====================================== -->

      <div
        v-if="errorBoletines"
        class="mensaje-error"
      >

        <i class="fa-solid fa-circle-exclamation"></i>

        {{ errorBoletines }}

      </div>


      <!-- =====================================
           CARGANDO
      ====================================== -->

      <div
        v-if="cargando"
        class="mensaje-cargando"
      >

        <i class="fa-solid fa-spinner fa-spin"></i>

        Cargando boletines...

      </div>


      <!-- =====================================
           CONTENIDO
      ====================================== -->

      <template v-else>


        <!-- =====================================
             BUSCADOR
        ====================================== -->

        <section class="boletines-toolbar">

          <div class="buscador-boletines">

            <i class="fa-solid fa-magnifying-glass"></i>

            <input
              v-model="busqueda"
              type="text"
              placeholder="Buscar alumno por nombre, apellido o DNI..."
            />

          </div>

        </section>


        <!-- =====================================
             CONTADOR
        ====================================== -->

        <div class="boletines-contador">

          <span>

            <i class="fa-solid fa-users"></i>

            {{ alumnosFiltrados.length }}

            {{
              alumnosFiltrados.length === 1
                ? "alumno"
                : "alumnos"
            }}

          </span>

        </div>


        <!-- =====================================
             LISTA DE ALUMNOS
        ====================================== -->

        <section class="boletines-lista-wrapper">

          <div class="boletines-lista">


            <!-- ENCABEZADO -->

            <div class="boletines-lista-header">

              <span>
                Alumno
              </span>

              <span class="columna-accion">
                Acción
              </span>

            </div>


            <!-- SIN ALUMNOS -->

            <div
              v-if="alumnosFiltrados.length === 0"
              class="boletines-vacio"
            >

              <i class="fa-solid fa-user-graduate"></i>

              <p>
                No se encontraron alumnos.
              </p>

            </div>


            <!-- ALUMNOS -->

            <div
              v-for="alumno in alumnosFiltrados"
              :key="alumno.id_alumno"
              class="boletin-alumno-fila"
            >


              <!-- DATOS DEL ALUMNO -->

              <div class="boletin-alumno-nombre">

                <div class="boletin-alumno-avatar">

                  {{ obtenerIniciales(alumno) }}

                </div>


                <div class="datos-alumno">

                  <strong>

                    {{ alumno.nombre }}
                    {{ alumno.apellido }}

                  </strong>


                  <span
                    v-if="alumno.dni"
                  >

                    DNI:
                    {{ alumno.dni }}

                  </span>

                </div>

              </div>


              <!-- ACCIÓN -->

              <div class="columna-accion">

                <button
                  class="btn-ver-boletin"
                  type="button"
                  @click="abrirBoletin(alumno)"
                >

                  <i class="fa-solid fa-file-lines"></i>

                  Ver boletín

                </button>

              </div>

            </div>


          </div>

        </section>

      </template>

    </main>


    <!-- =====================================
         MODAL DEL BOLETÍN
    ====================================== -->

    <div
      v-if="mostrarModalBoletin"
      class="boletin-modal"
      @click.self="cerrarModalBoletin"
    >

      <section class="boletin-modal-contenido">


        <!-- HEADER -->

        <header class="boletin-modal-header">

          <div>

            <span class="boletin-modal-etiqueta">

              <i class="fa-solid fa-file-lines"></i>

              Boletín escolar

            </span>


            <h2>

              {{ alumnoSeleccionado?.nombre }}
              {{ alumnoSeleccionado?.apellido }}

            </h2>


            <p>
              {{ cursoNombre }}
            </p>

          </div>


          <button
            class="boletin-cerrar-modal"
            type="button"
            @click="cerrarModalBoletin"
          >

            <i class="fa-solid fa-xmark"></i>

          </button>

        </header>


        <!-- =====================================
             INFORMACIÓN DEL ALUMNO
        ====================================== -->

        <div class="boletin-info">


          <div class="boletin-info-item">

            <span>
              Alumno
            </span>

            <strong>

              {{ alumnoSeleccionado?.nombre }}
              {{ alumnoSeleccionado?.apellido }}

            </strong>

          </div>


          <div class="boletin-info-item">

            <span>
              DNI
            </span>

            <strong>

              {{ alumnoSeleccionado?.dni || "No disponible" }}

            </strong>

          </div>


          <div class="boletin-info-item">

            <span>
              Período
            </span>

            <strong>

              {{ nombrePeriodos }}

            </strong>

          </div>


        </div>


        <!-- =====================================
             TABLA
        ====================================== -->

        <div class="boletin-tabla-wrapper">

          <table class="boletin-tabla">


            <thead>

              <tr>

                <th>
                  Materia
                </th>

                <th>
                  1.º Nota orientadora
                </th>

                <th>
                  1.º Cuatrimestre
                </th>

                <th>
                  2.º Nota orientadora
                </th>

                <th>
                  2.º Cuatrimestre
                </th>

                <th>
                  Promedio materia
                </th>

              </tr>

            </thead>


            <tbody>


              <!-- SIN MATERIAS -->

              <tr
                v-if="materiasDelAlumno.length === 0"
              >

                <td
                  colspan="6"
                  class="tabla-vacia"
                >

                  No hay materias disponibles para mostrar.

                </td>

              </tr>


              <!-- MATERIAS -->

              <tr
                v-for="materia in materiasDelAlumno"
                :key="materia.id_asignacion"
              >


                <!-- MATERIA -->

                <td class="materia-nombre">

                  {{ materia.nombreMateria }}

                </td>


                <!-- 1.º NOTA ORIENTADORA -->

                <td>

                  <span
                    v-if="materia.periodo1"
                    class="nota-orientadora"
                  >

                    {{ obtenerNotaOrientadora(materia.periodo1) }}

                  </span>

                  <span
                    v-else
                    class="sin-dato"
                  >
                    —
                  </span>

                </td>


                <!-- 1.º CUATRIMESTRE -->

                <td>

                  <strong
                    v-if="materia.periodo1"
                    class="nota-cuatrimestre"
                  >

                    {{ obtenerValorNota(materia.periodo1) }}

                  </strong>

                  <span
                    v-else
                    class="pendiente"
                  >

                    Pendiente

                  </span>

                </td>


                <!-- 2.º NOTA ORIENTADORA -->

                <td>

                  <span
                    v-if="materia.periodo2"
                    class="nota-orientadora"
                  >

                    {{ obtenerNotaOrientadora(materia.periodo2) }}

                  </span>

                  <span
                    v-else
                    class="sin-dato"
                  >
                    —
                  </span>

                </td>


                <!-- 2.º CUATRIMESTRE -->

                <td>

                  <strong
                    v-if="materia.periodo2"
                    class="nota-cuatrimestre"
                  >

                    {{ obtenerValorNota(materia.periodo2) }}

                  </strong>

                  <span
                    v-else
                    class="pendiente"
                  >

                    Pendiente

                  </span>

                </td>


                <!-- PROMEDIO -->

                <td>

                  <strong class="promedio">

                    {{ obtenerPromedioMateria(materia) }}

                  </strong>

                </td>

              </tr>

            </tbody>

          </table>

        </div>


        <!-- =====================================
             PROMEDIO GENERAL
        ====================================== -->

        <div class="promedio-general">

          <div>

            <span>
              Promedio general
            </span>

            <strong>
              {{ promedioGeneral }}
            </strong>

          </div>

          <i class="fa-solid fa-chart-line"></i>

        </div>


        <!-- FOOTER -->

        <footer class="boletin-modal-footer">

          <button
            type="button"
            class="btn-cerrar-boletin"
            @click="cerrarModalBoletin"
          >

            Cerrar

          </button>

        </footer>


      </section>

    </div>

  </div>

</template>


<script setup>

import {
  ref,
  computed,
  onMounted
} from "vue";

import {
  useRoute,
  useRouter
} from "vue-router";


import {
  obtenerCursos,
  obtenerPeriodosBoletines,
  obtenerPlanillaBoletinCurso
} from "@/services/academico-service.js";


// ==========================================
// ROUTER
// ==========================================

const route = useRoute();

const router = useRouter();


// ==========================================
// ESTADO
// ==========================================

const cargando =
  ref(true);

const errorBoletines =
  ref("");

const busqueda =
  ref("");


// ==========================================
// CURSO
// ==========================================

const idCurso =
  ref(route.params.id_curso);

const cursoNombre =
  ref("Curso");


// ==========================================
// PERÍODOS
// ==========================================

const periodos =
  ref([]);

const planillas =
  ref([]);


// ==========================================
// ALUMNOS
// ==========================================

const alumnos =
  ref([]);


// ==========================================
// MODAL
// ==========================================

const mostrarModalBoletin =
  ref(false);

const alumnoSeleccionado =
  ref(null);


// ==========================================
// CARGAR DATOS
// ==========================================

const cargarBoletines = async () => {

  cargando.value = true;

  errorBoletines.value = "";


  try {

    // --------------------------------------
    // CURSO
    // --------------------------------------

    const resultadoCursos =
      await obtenerCursos();


    if (resultadoCursos.success) {

      const curso =
        resultadoCursos.data?.find(
          (item) =>
            Number(item.id_curso) ===
            Number(idCurso.value)
        );


      if (curso) {

        cursoNombre.value =
          curso.nombre_curso ||
          curso.nombre ||
          `Curso ${idCurso.value}`;

      } else {

        cursoNombre.value =
          `Curso ${idCurso.value}`;

      }

    }


    // --------------------------------------
    // PERÍODOS
    // --------------------------------------

    const resultadoPeriodos =
      await obtenerPeriodosBoletines();


    if (!resultadoPeriodos.success) {

      throw new Error(
        resultadoPeriodos.message ||
        "No se pudieron obtener los períodos."
      );

    }


    const periodosBackend =
      Array.isArray(resultadoPeriodos.data)
        ? resultadoPeriodos.data
        : [];


    /*
      Ordenamos los períodos por cuatrimestre
      y nos quedamos con los dos primeros.
    */

    periodos.value =
      [...periodosBackend]
        .sort(
          (a, b) =>
            Number(a.cuatrimestre) -
            Number(b.cuatrimestre)
        )
        .slice(0, 2);


    if (periodos.value.length === 0) {

      throw new Error(
        "No hay períodos de boletines disponibles."
      );

    }


    // --------------------------------------
    // PLANILLAS
    // --------------------------------------

    const resultadosPlanillas =
      await Promise.all(

        periodos.value.map(
          (periodo) =>
            obtenerPlanillaBoletinCurso(
              idCurso.value,
              periodo.id_periodo
            )
        )

      );


    const planillasValidas =
      resultadosPlanillas.filter(
        (resultado) =>
          resultado.success
      );


    if (planillasValidas.length === 0) {

      const primerError =
        resultadosPlanillas.find(
          (resultado) =>
            !resultado.success
        );


      throw new Error(
        primerError?.message ||
        "No se pudo obtener la planilla del curso."
      );

    }


    planillas.value =
      planillasValidas.map(
        (resultado) =>
          resultado.data
      );


    // --------------------------------------
    // ALUMNOS
    // --------------------------------------

    const alumnosMap =
      new Map();


    planillas.value.forEach(
      (planilla) => {

        const lista =
          Array.isArray(planilla.alumnos)
            ? planilla.alumnos
            : [];


        lista.forEach(
          (alumno) => {

            if (
              !alumnosMap.has(
                alumno.id_alumno
              )
            ) {

              alumnosMap.set(
                alumno.id_alumno,
                alumno
              );

            }

          }
        );

      }
    );


    alumnos.value =
      Array.from(
        alumnosMap.values()
      );


  } catch (error) {

    errorBoletines.value =
      error.message ||
      "No se pudieron cargar los boletines.";

  } finally {

    cargando.value = false;

  }

};


// ==========================================
// ALUMNOS FILTRADOS
// ==========================================

const alumnosFiltrados =
  computed(() => {

    const texto =
      busqueda.value
        .trim()
        .toLowerCase();


    if (!texto) {

      return alumnos.value;

    }


    return alumnos.value.filter(
      (alumno) => {

        const nombreCompleto =
          `${alumno.nombre || ""} ${alumno.apellido || ""}`
            .toLowerCase();


        const dni =
          String(
            alumno.dni || ""
          ).toLowerCase();


        return (
          nombreCompleto.includes(texto) ||
          dni.includes(texto)
        );

      }
    );

  });


// ==========================================
// PERÍODOS MOSTRADOS
// ==========================================

const nombrePeriodos =
  computed(() => {

    if (periodos.value.length === 0) {

      return "Sin períodos";

    }


    return periodos.value
      .map(
        (periodo) =>
          `${periodo.cuatrimestre}° cuatrimestre`
      )
      .join(" · ");

  });


// ==========================================
// MATERIAS DEL ALUMNO
// ==========================================

const materiasDelAlumno =
  computed(() => {

    if (!alumnoSeleccionado.value) {

      return [];

    }


    const idAlumno =
      alumnoSeleccionado.value.id_alumno;


    const materiasMap =
      new Map();


    planillas.value.forEach(
      (planilla, indicePeriodo) => {

        const materias =
          Array.isArray(planilla.materias)
            ? planilla.materias
            : [];


        materias.forEach(
          (materia) => {

            const asignacion =
              materia.asignacion || {};


            const idAsignacion =
              asignacion.id_asignacion ??
              materia.id_asignacion;


            if (
              idAsignacion === undefined ||
              idAsignacion === null
            ) {

              return;

            }


            if (
              !materiasMap.has(
                idAsignacion
              )
            ) {

              materiasMap.set(
                idAsignacion,
                {
                  id_asignacion:
                    idAsignacion,

                  nombreMateria:
                    obtenerNombreMateria(
                      materia
                    ),

                  periodo1:
                    null,

                  periodo2:
                    null
                }
              );

            }


            const materiaActual =
              materiasMap.get(
                idAsignacion
              );


            const calificacion =
              obtenerCalificacionAlumno(
                materia,
                idAlumno
              );


            if (indicePeriodo === 0) {

              materiaActual.periodo1 =
                calificacion;

            }


            if (indicePeriodo === 1) {

              materiaActual.periodo2 =
                calificacion;

            }

          }
        );

      }
    );


    return Array.from(
      materiasMap.values()
    );

  });


// ==========================================
// OBTENER CALIFICACIÓN DEL ALUMNO
// ==========================================

function obtenerCalificacionAlumno(
  materia,
  idAlumno
) {

  const calificaciones =
    Array.isArray(
      materia.calificaciones
    )
      ? materia.calificaciones
      : [];


  return (
    calificaciones.find(
      (calificacion) =>
        Number(
          calificacion.id_alumno
        ) === Number(idAlumno)
    ) || null
  );

}


// ==========================================
// NOMBRE DE MATERIA
// ==========================================

function obtenerNombreMateria(
  materia
) {

  const asignacion =
    materia.asignacion || {};


  /*
    Usamos el nombre que eventualmente
    entregue el backend.

    El endpoint de ejemplo solamente
    garantiza id_asignacion, por eso
    dejamos un fallback.
  */

  return (
    materia.nombre_materia ||
    materia.nombreMateria ||
    materia.materia ||
    asignacion.nombre_materia ||
    asignacion.nombreMateria ||
    asignacion.materia ||
    `Materia ${asignacion.id_asignacion ?? materia.id_asignacion}`
  );

}


// ==========================================
// NOTA ORIENTADORA
// ==========================================

function obtenerNotaOrientadora(
  calificacion
) {

  if (!calificacion) {

    return "—";

  }


  const tipo =
    String(
      calificacion.tipo || ""
    ).toLowerCase();


  switch (tipo) {

    case "ted":
      return "TED";

    case "tep":
      return "TEP";

    case "tea":
      return "TEA";

    case "sin_calificar":
      return "Sin calificar";

    case "numerica":
      return "—";

    default:
      return calificacion.tipo || "—";

  }

}


// ==========================================
// VALOR DE LA NOTA
// ==========================================

function obtenerValorNota(
  calificacion
) {

  if (!calificacion) {

    return "—";

  }


  const tipo =
    String(
      calificacion.tipo || ""
    ).toLowerCase();


  if (tipo === "numerica") {

    if (
      calificacion.valor === null ||
      calificacion.valor === undefined
    ) {

      return "—";

    }


    return calificacion.valor;

  }


  if (
    tipo === "sin_calificar"
  ) {

    return "Sin calificar";

  }


  /*
    TED / TEP / TEA no tienen
    un valor numérico.
  */

  return "—";

}


// ==========================================
// PROMEDIO DE MATERIA
// ==========================================

function obtenerPromedioMateria(
  materia
) {

  const valores = [];


  if (
    materia.periodo1 &&
    esNotaNumerica(
      materia.periodo1
    )
  ) {

    valores.push(
      Number(
        materia.periodo1.valor
      )
    );

  }


  if (
    materia.periodo2 &&
    esNotaNumerica(
      materia.periodo2
    )
  ) {

    valores.push(
      Number(
        materia.periodo2.valor
      )
    );

  }


  /*
    Si no hay dos notas numéricas,
    no inventamos un promedio.
  */

  if (valores.length === 0) {

    return "—";

  }


  const promedio =
    valores.reduce(
      (total, valor) =>
        total + valor,
      0
    ) / valores.length;


  return promedio
    .toFixed(1)
    .replace(".", ",");

}


// ==========================================
// SABER SI ES NUMÉRICA
// ==========================================

function esNotaNumerica(
  calificacion
) {

  return (
    String(
      calificacion?.tipo || ""
    ).toLowerCase() ===
    "numerica" &&
    calificacion.valor !== null &&
    calificacion.valor !== undefined
  );

}


// ==========================================
// PROMEDIO GENERAL
// ==========================================

const promedioGeneral =
  computed(() => {

    const promedios = [];


    materiasDelAlumno.value.forEach(
      (materia) => {

        const promedio =
          obtenerPromedioMateria(
            materia
          );


        if (promedio !== "—") {

          promedios.push(
            Number(
              promedio.replace(",", ".")
            )
          );

        }

      }
    );


    if (promedios.length === 0) {

      return "—";

    }


    const resultado =
      promedios.reduce(
        (total, valor) =>
          total + valor,
        0
      ) /
      promedios.length;


    return resultado
      .toFixed(1)
      .replace(".", ",");

  });


// ==========================================
// INICIALES
// ==========================================

function obtenerIniciales(
  alumno
) {

  const nombre =
    alumno.nombre || "";

  const apellido =
    alumno.apellido || "";


  return (
    nombre.charAt(0) +
    apellido.charAt(0)
  ).toUpperCase();

}


// ==========================================
// ABRIR BOLETÍN
// ==========================================

function abrirBoletin(
  alumno
) {

  alumnoSeleccionado.value =
    alumno;


  mostrarModalBoletin.value =
    true;

}


// ==========================================
// CERRAR MODAL
// ==========================================

function cerrarModalBoletin() {

  mostrarModalBoletin.value =
    false;


  alumnoSeleccionado.value =
    null;

}


// ==========================================
// VOLVER A CURSOS
// ==========================================

function volverCursos() {

  router.push(
    "/preceptor/cursos"
  );

}


// ==========================================
// INICIO
// ==========================================

onMounted(() => {

  cargarBoletines();

});

</script>


<style src="../BoletinesAlumnos.css"></style>