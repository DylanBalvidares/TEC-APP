<template>
  <div class="alumnos-page">

    <!-- CONTENIDO PRINCIPAL -->
    <main class="alumnos-contenido">

      <!-- BOTÓN VOLVER -->
      <button class="volver-cursos-btn" @click="volverCursos">
        <i class="fa-solid fa-arrow-left"></i>
        Volver a cursos
      </button>

      <!-- HEADER -->
      <div class="alumnos-header">
        <div>
          <h1>Alumnos</h1>

          <p v-if="cursoSeleccionado">
            Alumnos de {{ cursoSeleccionado.nombre_curso || cursoSeleccionado.nombre }}
          </p>

          <p v-else>
            Cargando información del curso...
          </p>
        </div>
      </div>

      <!-- BANNER INFORMATIVO -->
      <div class="preceptor-info-banner subtle">
        <i class="fa-solid fa-circle-info"></i>
        <div>
          Podés buscar alumnos por <strong>nombre, apellido, DNI o tutor</strong>. Usá <em>Agregar alumno</em> para matricular un nuevo estudiante en este curso o <em>Comunicar al curso</em> para enviar un aviso general a todas las familias de la división.
        </div>
      </div>

      <!-- ERROR -->
      <div v-if="errorAlumnos" class="mensaje-error">
        <i class="fa-solid fa-circle-exclamation"></i>
        {{ errorAlumnos }}
      </div>

      <!-- TOOLBAR -->
      <div class="alumnos-toolbar">

        <!-- BUSCADOR -->
        <div class="buscador-alumnos">
          <i class="fa-solid fa-magnifying-glass"></i>

          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar por nombre, DNI, tutor..."
          />
        </div>

        <div class="toolbar-acciones">

          <!-- COMUNICAR AL CURSO -->
          <button
            class="btn-comunicar-curso"
            @click="abrirModalComunicado"
          >
            <i class="fa-solid fa-bullhorn"></i>
            Comunicar al curso
          </button>

          <!-- AGREGAR -->
          <button
            class="btn-cargar-alumno"
            @click="abrirModalNuevo"
          >
            <i class="fa-solid fa-user-plus"></i>
            Agregar alumno
          </button>

        </div>

      </div>

      <!-- CONTADOR -->
      <div class="alumnos-contador">
        Mostrando {{ alumnosFiltrados.length }}
        {{ alumnosFiltrados.length === 1 ? "alumno" : "alumnos" }}
      </div>

      <!-- LISTA -->
    <div class="alumnos-lista-wrapper">
      <div class="alumnos-lista">

        <!-- CABECERA -->
        <div class="alumnos-lista-header">
          <div>Alumno</div>
          <div>DNI</div>
          <div>Fecha de nacimiento</div>
          <div>Gmail</div>
          <div>Tutor</div>
          <div>Teléfono</div>
          <div>Domicilio</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>

        <!-- CARGANDO -->
        <div
          v-if="cargandoAlumnos"
          class="sin-alumnos"
        >
          <i class="fa-solid fa-spinner fa-spin"></i>
          Cargando alumnos...
        </div>

        <!-- SIN ALUMNOS -->
        <div
          v-else-if="alumnosFiltrados.length === 0"
          class="sin-alumnos"
        >
          <i class="fa-solid fa-user-group"></i>

          <strong>
            {{ busqueda ? "No se encontraron alumnos" : "No hay alumnos en este curso" }}
          </strong>

          <span v-if="busqueda">
            Probá con otro término de búsqueda.
          </span>
        </div>

        <!-- FILAS -->
        <div
          v-else
          v-for="alumno in alumnosFiltrados"
          :key="alumno.id_alumno"
          class="alumno-fila"
        >

          <!-- ALUMNO -->
          <div class="alumno-nombre">
            <div class="alumno-avatar">
              {{ obtenerIniciales(alumno) }}
            </div>

            <span>
              {{ alumno.nombre }} {{ alumno.apellido }}
            </span>
          </div>

          <!-- DNI -->
          <div class="alumno-dni">
            {{ alumno.dni || "—" }}
          </div>

          <!-- FECHA -->
          <div class="alumno-fecha">
            {{ formatearFecha(alumno.fecha_nacimiento) }}
          </div>

          <div class="alumno-email">
            <i class="fa-solid fa-envelope"></i>
            <span :title="alumno.email">
              {{ alumno.email || "—" }}
            </span>

            <!-- Cuenta de acceso vinculada al legajo -->
            <i
              v-if="alumno.id_usuario"
              class="fa-solid fa-user-check cuenta-icono"
              title="Tiene cuenta de acceso vinculada"
            ></i>
            <i
              v-else
              class="fa-solid fa-user-slash cuenta-icono sin-cuenta"
              title="Sin cuenta de acceso vinculada"
            ></i>
          </div>

          <!-- TUTOR -->
          <div class="alumno-tutor">
            {{ alumno.nombre_tutor || "—" }}
          </div>

          <!-- TELÉFONO -->
          <div class="alumno-telefono">
            {{ alumno.telefono_tutor || "—" }}
          </div>

          <!-- DOMICILIO -->
          <div class="alumno-domicilio">
            {{ alumno.domicilio || "—" }}
          </div>

          <!-- ESTADO -->
          <div class="alumno-estado">
            <span
              class="estado-alumno"
              :class="obtenerClaseEstado(alumno.estado)"
            >
              {{ obtenerEstado(alumno.estado) }}
            </span>
          </div>

          <!-- ACCIONES -->
          <div class="alumno-acciones">

            <!-- EDITAR -->
            <button
              class="accion-btn editar"
              title="Editar alumno"
              @click="abrirModalEditar(alumno)"
            >
              <i class="fa-solid fa-pen"></i>
            </button>

            <!-- ELIMINAR -->
            <button
              class="accion-btn eliminar"
              title="Eliminar alumno"
              @click="eliminarAlumnoSeleccionado(alumno)"
            >
              <i class="fa-solid fa-trash"></i>
            </button>

            <!-- EMAIL -->
            <button
              class="accion-btn email"
              title="Enviar email"
              @click="abrirModalEmail(alumno)"
            >
              <i class="fa-solid fa-envelope"></i>
            </button>

          </div>

        </div>

      </div>
    </div>
    </main>


    <!-- =====================================================
         MODAL ALUMNO
    ====================================================== -->

    <div
      v-if="mostrarModalAlumno"
      class="modal activo"
      @click.self="cerrarModalAlumno"
    >

      <div class="modal-contenido">

        <!-- HEADER -->
        <div class="modal-header">

          <div>
            <h2>
              {{ modoEdicion ? "Editar alumno" : "Agregar alumno" }}
            </h2>

            <p>
              {{ modoEdicion
                ? "Modificá los datos del alumno."
                : "Completá los datos para registrar un nuevo alumno."
              }}
            </p>
          </div>

          <button
            class="cerrar-modal"
            @click="cerrarModalAlumno"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

        </div>


        <!-- PASOS -->
        <div class="pasos-modal">

          <div
            class="paso"
            :class="{
              activo: pasoActual === 1,
              completado: pasoActual > 1
            }"
          >
            <span class="paso-numero">1</span>
            Datos personales
          </div>

          <div class="paso-linea"></div>

          <div
            class="paso"
            :class="{
              activo: pasoActual === 2,
              completado: pasoActual > 2
            }"
          >
            <span class="paso-numero">2</span>
            Tutor
          </div>

          <div class="paso-linea"></div>

          <div
            class="paso"
            :class="{
              activo: pasoActual === 3,
              completado: pasoActual > 3
            }"
          >
            <span class="paso-numero">3</span>
            Curso
          </div>

        </div>


        <!-- ERROR -->
        <div
          v-if="errorFormulario"
          class="formulario-error"
        >
          <i class="fa-solid fa-circle-exclamation"></i>
          {{ errorFormulario }}
        </div>


        <!-- FORMULARIO -->
        <form @submit.prevent="guardarAlumno">

          <!-- PASO 1 -->
          <div
            v-if="pasoActual === 1"
            class="form-paso activo"
          >

            <div class="modal-seccion">
              <h3>Datos personales</h3>
              <p>Ingresá la información básica del alumno.</p>
            </div>

            <div class="form-fila">

              <div class="form-grupo">
                <label>Nombre *</label>

                <input
                  v-model="formulario.nombre"
                  type="text"
                  placeholder="Ej. Juan"
                  required
                />
              </div>

              <div class="form-grupo">
                <label>Apellido *</label>

                <input
                  v-model="formulario.apellido"
                  type="text"
                  placeholder="Ej. Pérez"
                  required
                />
              </div>

            </div>

            <div class="form-grupo">
              <label>DNI *</label>

              <input
                v-model="formulario.dni"
                type="text"
                placeholder="Ej. 45123456"
                required
              />
              <span class="preceptor-field-hint">
                <i class="fa-solid fa-circle-question"></i> Ingresá sólo números sin puntos ni espacios (7 u 8 dígitos).
              </span>
            </div>

            <div class="form-grupo">
              <label>Fecha de nacimiento *</label>

              <input
                v-model="formulario.fecha_nacimiento"
                type="date"
                required
              />
              <span class="preceptor-field-hint">
                <i class="fa-solid fa-circle-question"></i> Formato de fecha requerido para la ficha y legajo oficial.
              </span>
            </div>

            <div class="form-grupo">
                <label>Gmail *</label>

                <input
                  v-model="formulario.email"
                  type="email"
                  placeholder="Ej. juan.perez@gmail.com"
                  required
                />
                <span class="preceptor-field-hint">
                  <i class="fa-solid fa-circle-question"></i> Correo electrónico para acceso a la plataforma o contacto del alumno.
                </span>
            </div>

          </div>


          <!-- PASO 2 -->
          <div
            v-if="pasoActual === 2"
            class="form-paso activo"
          >

            <div class="modal-seccion">
              <h3>Datos del tutor</h3>
              <p>Ingresá los datos de contacto del tutor.</p>
            </div>

            <div class="form-grupo">
              <label>Nombre del tutor *</label>

              <input
                v-model="formulario.nombre_tutor"
                type="text"
                placeholder="Ej. María Pérez"
                required
              />
            </div>

            <div class="form-grupo">
              <label>Teléfono *</label>

              <TelefonoInput
                v-model="formulario.telefono_tutor"
                placeholder="Ej. 2364 71-5375"
                requerido
                :error-externo="errorTelefono"
              />
              <p v-if="errorTelefono" class="form-error">{{ errorTelefono }}</p>
              <span class="preceptor-field-hint">
                <i class="fa-solid fa-circle-question"></i> Código de área sin 0 y número sin 15. Utilizado para envíos automáticos de WhatsApp.
              </span>
            </div>

            <div class="form-grupo">
              <label>Domicilio *</label>

              <input
                v-model="formulario.domicilio"
                type="text"
                placeholder="Ej. Av. Rivadavia 1234"
                required
              />
              <span class="preceptor-field-hint">
                <i class="fa-solid fa-circle-question"></i> Calle, numeración y localidad de residencia actual del alumno.
              </span>
            </div>

          </div>


          <!-- PASO 3 -->
          <div
            v-if="pasoActual === 3"
            class="form-paso activo"
          >

            <div class="modal-seccion">
              <h3>Curso y estado</h3>
              <p>El alumno será asignado al curso seleccionado.</p>
            </div>

            <div class="form-grupo">
              <label>Curso</label>

              <input
                :value="cursoSeleccionado?.nombre_curso || cursoSeleccionado?.nombre || 'Curso seleccionado'"
                type="text"
                disabled
              />
            </div>

            <div class="form-grupo">
              <label>Estado</label>

              <select v-model="formulario.estado">
                <option value="activo">Activo</option>
                <option value="condicional">Condicional</option>
                <option value="inactivo">Inactivo</option>
              </select>
              <span class="preceptor-field-hint">
                <i class="fa-solid fa-circle-question"></i> Los alumnos 'Activos' figuran normalmente en planillas de asistencia y libreta. 'Condicional' indica documentación o situación de pase pendiente.
              </span>
            </div>

            <!-- CUENTA DE ACCESO (opcional / editable) -->
            <UserAccessPanel
              :key="(modoEdicion ? 'edit-' + alumnoEditandoId : 'nuevo')"
              :modo="modoEdicion ? 'editar' : 'crear'"
              :usuarioActual="cuentaVinculada"
              :ocultarRol="true"
              :emailSugerido="formulario.email"
              :abiertoPorDefecto="!modoEdicion"
              :cuentaOpcional="true"
              @update:usuarioData="actualizarDatosCuenta"
            />

          </div>


          <!-- BOTONES -->
          <div class="modal-acciones">

            <button
              v-if="pasoActual > 1"
              type="button"
              class="btn-cancelar"
              @click="pasoActual--"
            >
              <i class="fa-solid fa-arrow-left"></i>
              Atrás
            </button>

            <button
              v-else
              type="button"
              class="btn-cancelar"
              @click="cerrarModalAlumno"
            >
              Cancelar
            </button>


            <button
              v-if="pasoActual < 3"
              type="button"
              class="btn-siguiente"
              @click="siguientePaso"
            >
              Siguiente
              <i class="fa-solid fa-arrow-right"></i>
            </button>

            <button
              v-else
              type="submit"
              class="btn-guardar"
              :disabled="guardandoAlumno"
            >
              <i
                v-if="guardandoAlumno"
                class="fa-solid fa-spinner fa-spin"
              ></i>

              <i
                v-else
                class="fa-solid fa-floppy-disk"
              ></i>

              {{ guardandoAlumno ? "Guardando..." : "Guardar alumno" }}
            </button>

          </div>

        </form>

      </div>
    </div>


    <!-- =====================================================
         MODAL ENVIAR EMAIL INDIVIDUAL
    ====================================================== -->

    <div
      v-if="mostrarModalEmail"
      class="modal activo"
      @click.self="cerrarModalEmail"
    >

      <div class="modal-contenido modal-email">

        <!-- HEADER -->
        <div class="modal-header">

          <div>
            <h2>Enviar email</h2>

            <p>
              Enviá un mensaje directamente al alumno.
            </p>
          </div>

          <button
            class="cerrar-modal"
            @click="cerrarModalEmail"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

        </div>


        <!-- INFORMACIÓN DEL ALUMNO -->
        <div
          v-if="alumnoEmail"
          class="email-destinatario"
        >

          <div class="email-icono">
            <i class="fa-solid fa-envelope"></i>
          </div>

          <div>
            <span>DESTINATARIO</span>

            <strong>
              {{ alumnoEmail.nombre }}
              {{ alumnoEmail.apellido }}
            </strong>
          </div>

        </div>


        <!-- ERROR -->
        <div
          v-if="errorEmail"
          class="email-error"
        >
          <i class="fa-solid fa-circle-exclamation"></i>
          {{ errorEmail }}
        </div>


        <!-- ÉXITO -->
        <div
          v-if="mensajeEmail"
          class="email-exito"
        >
          <i class="fa-solid fa-circle-check"></i>
          {{ mensajeEmail }}
        </div>


        <!-- FORMULARIO EMAIL -->
        <form
          class="form-email"
          @submit.prevent="enviarEmail"
        >

          <div class="form-grupo">
            <label>Asunto *</label>

            <input
              v-model="formularioEmail.asunto"
              type="text"
              placeholder="Ej. Citación"
              required
            />
          </div>

          <div class="form-grupo">
            <label>Mensaje *</label>

            <textarea
              v-model="formularioEmail.mensaje"
              placeholder="Escribí el mensaje que querés enviar..."
              required
            ></textarea>
          </div>


          <div class="modal-acciones">

            <button
              type="button"
              class="btn-cancelar"
              @click="cerrarModalEmail"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="btn-enviar-email"
              :disabled="enviandoEmail"
            >

              <i
                v-if="enviandoEmail"
                class="fa-solid fa-spinner fa-spin"
              ></i>

              <i
                v-else
                class="fa-solid fa-paper-plane"
              ></i>

              {{ enviandoEmail ? "Enviando..." : "Enviar email" }}

            </button>

          </div>

        </form>

      </div>
    </div>


    <!-- =====================================================
         MODAL COMUNICADO GENERAL
    ====================================================== -->

    <div
      v-if="mostrarModalComunicado"
      class="modal activo"
      @click.self="cerrarModalComunicado"
    >

      <div class="modal-contenido modal-comunicado">

        <!-- HEADER -->
        <div class="modal-header">

          <div>
            <h2>Comunicar al curso</h2>

            <p>
              Enviá un comunicado a todos los alumnos de
              {{ cursoSeleccionado?.nombre_curso || cursoSeleccionado?.nombre || "este curso" }}.
            </p>
          </div>

          <button
            class="cerrar-modal"
            @click="cerrarModalComunicado"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

        </div>


        <!-- DESTINO -->
        <div class="comunicado-destino">

          <div class="comunicado-icono">
            <i class="fa-solid fa-bullhorn"></i>
          </div>

          <div>
            <span>DESTINO</span>

            <strong>
              {{ cursoSeleccionado?.nombre_curso || cursoSeleccionado?.nombre || "Curso seleccionado" }}
            </strong>
          </div>

        </div>

        <div class="preceptor-info-banner subtle" style="margin: 0 20px 16px 20px;">
          <i class="fa-solid fa-circle-info"></i>
          <div>
            Este comunicado se publicará en el panel institucional y notificará por correo o aviso a las familias de los estudiantes de este curso.
          </div>
        </div>


        <!-- ERROR -->
        <div
          v-if="errorComunicado"
          class="comunicado-error"
        >
          <i class="fa-solid fa-circle-exclamation"></i>
          {{ errorComunicado }}
        </div>


        <!-- ÉXITO -->
        <div
          v-if="mensajeComunicado"
          class="comunicado-exito"
        >
          <i class="fa-solid fa-circle-check"></i>
          {{ mensajeComunicado }}
        </div>


        <!-- FORMULARIO -->
        <form
          class="form-comunicado"
          @submit.prevent="enviarComunicado"
        >

          <div class="form-grupo">
            <label>Título *</label>

            <input
              v-model="formularioComunicado.titulo"
              type="text"
              maxlength="255"
              placeholder="Ej. Reunión de padres"
              required
            />
          </div>


          <div class="form-grupo">
            <label>Importancia</label>

            <select v-model="formularioComunicado.importancia">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>


          <div class="form-grupo">
            <label>Mensaje *</label>

            <textarea
              v-model="formularioComunicado.mensaje"
              placeholder="Escribí el comunicado que querés enviar..."
              required
            ></textarea>
          </div>


          <div class="modal-acciones">

            <button
              type="button"
              class="btn-cancelar"
              @click="cerrarModalComunicado"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="btn-enviar-comunicado"
              :disabled="enviandoComunicado"
            >

              <i
                v-if="enviandoComunicado"
                class="fa-solid fa-spinner fa-spin"
              ></i>

              <i
                v-else
                class="fa-solid fa-bullhorn"
              ></i>

              {{ enviandoComunicado ? "Publicando..." : "Publicar comunicado" }}

            </button>

          </div>

        </form>

      </div>
    </div>

  </div>
</template>


<script setup>

import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  obtenerCursos,
  obtenerAlumnosCurso,
  crearAlumno,
  modificarAlumno,
  eliminarAlumno,
  actualizarCuentaAlumno,
  enviarEmailAlumno
} from "@/services/academico-service.js";

import {
  crearComunicado
} from "@/services/comunidad-service.js";

import TelefonoInput from "@/components/ui/TelefonoInput.vue";
import UserAccessPanel from "@/components/ui/UserAccessPanel.vue";
import { validarTelefonoAR, validarEmail } from "@/utils/validators.js";


/* =========================================================
   ROUTER
========================================================= */

const route = useRoute();
const router = useRouter();

const idCurso = computed(() => Number(route.params.id_curso));


/* =========================================================
   CURSO
========================================================= */

const cursoSeleccionado = ref(null);
const cursos = ref([]);


/* =========================================================
   ALUMNOS
========================================================= */

const alumnos = ref([]);

const cargandoAlumnos = ref(false);
const errorAlumnos = ref("");

const busqueda = ref("");


const alumnosFiltrados = computed(() => {

  const texto = busqueda.value.trim().toLowerCase();

  if (!texto) {
    return alumnos.value;
  }

  return alumnos.value.filter((alumno) => {

    const nombreCompleto =
      `${alumno.nombre || ""} ${alumno.apellido || ""}`.toLowerCase();

    return (
      nombreCompleto.includes(texto) ||
      String(alumno.dni || "").includes(texto) ||
      String(alumno.nombre_tutor || "").toLowerCase().includes(texto) ||
      String(alumno.telefono_tutor || "").includes(texto) ||
      String(alumno.domicilio || "").toLowerCase().includes(texto)
    );

  });

});


/* =========================================================
   MODAL ALUMNO
========================================================= */

const mostrarModalAlumno = ref(false);

const modoEdicion = ref(false);
const alumnoEditandoId = ref(null);

const pasoActual = ref(1);

const guardandoAlumno = ref(false);
const errorFormulario = ref("");
const errorTelefono = ref("");


const formularioInicial = () => ({
  nombre: "",
  apellido: "",
  dni: "",
  fecha_nacimiento: "",
  email: "",
  nombre_tutor: "",
  telefono_tutor: "",
  domicilio: "",
  estado: "activo"
});


const formulario = ref(formularioInicial());


/* =========================================================
   CUENTA DE ACCESO (panel UserAccessPanel)
========================================================= */

// Datos emitidos por el panel (email/contrasena) o null si está oculto.
const datosCuentaUsuario = ref(null);

// Cuenta actualmente vinculada al alumno en edición/creación.
const cuentaVinculada = ref(null);

// Si la ficha del alumno ya se creó pero la cuenta falla, guardamos el id
// para reintentar la cuenta al volver a "Guardar" sin duplicar el alumno.
const alumnoPendienteCuenta = ref(null);

const actualizarDatosCuenta = (datos) => {
  datosCuentaUsuario.value = datos;
};


/* =========================================================
   MODAL EMAIL
========================================================= */

const mostrarModalEmail = ref(false);

const alumnoEmail = ref(null);

const enviandoEmail = ref(false);

const errorEmail = ref("");
const mensajeEmail = ref("");

const formularioEmail = ref({
  asunto: "",
  mensaje: ""
});


/* =========================================================
   MODAL COMUNICADO
========================================================= */

const mostrarModalComunicado = ref(false);

const enviandoComunicado = ref(false);

const errorComunicado = ref("");
const mensajeComunicado = ref("");

const formularioComunicado = ref({
  titulo: "",
  mensaje: "",
  importancia: "media"
});


/* =========================================================
   CARGAR CURSO
========================================================= */

const cargarCurso = async () => {

  const resultado = await obtenerCursos();

  if (!resultado.success) {
    errorAlumnos.value = resultado.message;
    return;
  }

  cursos.value = resultado.data || [];

  cursoSeleccionado.value = cursos.value.find(
    (curso) => Number(curso.id_curso) === idCurso.value
  );

  if (!cursoSeleccionado.value) {
    errorAlumnos.value = "No se encontró el curso seleccionado.";
  }

};


/* =========================================================
   CARGAR ALUMNOS
========================================================= */

const cargarAlumnos = async () => {

  cargandoAlumnos.value = true;
  errorAlumnos.value = "";

  const resultado = await obtenerAlumnosCurso(idCurso.value);

  if (resultado.success) {

    alumnos.value = Array.isArray(resultado.data)
      ? resultado.data
      : [];

  } else if (resultado.status === 404) {

    alumnos.value = [];

  } else {

    errorAlumnos.value =
      resultado.message || "No se pudieron cargar los alumnos.";

  }

  cargandoAlumnos.value = false;

};


/* =========================================================
   INICIALES
========================================================= */

const obtenerIniciales = (alumno) => {

  const nombre = alumno.nombre?.trim()?.charAt(0) || "";
  const apellido = alumno.apellido?.trim()?.charAt(0) || "";

  return `${nombre}${apellido}`.toUpperCase();

};


/* =========================================================
   FECHA
========================================================= */

const formatearFecha = (fecha) => {

  if (!fecha) {
    return "—";
  }

  const fechaObj = new Date(fecha);

  if (Number.isNaN(fechaObj.getTime())) {
    return fecha;
  }

  return fechaObj.toLocaleDateString("es-AR");

};


/* =========================================================
   ESTADO
========================================================= */

const obtenerEstado = (estado) => {

  if (!estado) {
    return "Activo";
  }

  return estado.charAt(0).toUpperCase() + estado.slice(1);

};


const obtenerClaseEstado = (estado) => {

  if (estado === "condicional") {
    return "condicional";
  }

  if (estado === "inactivo") {
    return "inactivo";
  }

  return "activo";

};


/* =========================================================
   MODAL NUEVO
========================================================= */

const abrirModalNuevo = () => {

  modoEdicion.value = false;
  alumnoEditandoId.value = null;

  formulario.value = formularioInicial();

  pasoActual.value = 1;

  errorFormulario.value = "";

  cuentaVinculada.value = null;
  datosCuentaUsuario.value = null;
  alumnoPendienteCuenta.value = null;

  mostrarModalAlumno.value = true;

};


/* =========================================================
   MODAL EDITAR
========================================================= */

const abrirModalEditar = (alumno) => {

  modoEdicion.value = true;

  alumnoEditandoId.value = alumno.id_alumno;

  formulario.value = {
    nombre: alumno.nombre || "",
    apellido: alumno.apellido || "",
    dni: alumno.dni || "",
    fecha_nacimiento: alumno.fecha_nacimiento
      ? String(alumno.fecha_nacimiento).substring(0, 10)
      : "",
    email: alumno.email || "",
    nombre_tutor: alumno.nombre_tutor || "",
    telefono_tutor: alumno.telefono_tutor || "",
    domicilio: alumno.domicilio || "",
    estado: alumno.estado || "activo"
  };

  pasoActual.value = 1;

  errorFormulario.value = "";

  cuentaVinculada.value = alumno.id_usuario
    ? {
        id_usuario: alumno.id_usuario,
        email: alumno.usuario?.email || ""
      }
    : null;

  datosCuentaUsuario.value = null;
  alumnoPendienteCuenta.value = null;

  mostrarModalAlumno.value = true;

};


/* =========================================================
   CERRAR MODAL ALUMNO
========================================================= */

const cerrarModalAlumno = () => {

  if (guardandoAlumno.value) {
    return;
  }

  datosCuentaUsuario.value = null;
  alumnoPendienteCuenta.value = null;

  mostrarModalAlumno.value = false;

};


/* =========================================================
   SIGUIENTE PASO
========================================================= */

const siguientePaso = () => {

  errorFormulario.value = "";

  if (pasoActual.value === 1) {

    if (
      !formulario.value.nombre ||
      !formulario.value.apellido ||
      !formulario.value.dni ||
      !formulario.value.fecha_nacimiento
    ) {

      errorFormulario.value =
        "Completá todos los campos obligatorios.";

      return;
    }

    // Solo el paso activo está renderizado (v-if), así que el "required"
    // nativo del input no protege este campo en el submit final.
    const errorEmailPasoUno = validarEmail(formulario.value.email);

    if (errorEmailPasoUno) {
      errorFormulario.value = errorEmailPasoUno;
      return;
    }

  }


  if (pasoActual.value === 2) {

    if (
      !formulario.value.nombre_tutor ||
      !formulario.value.telefono_tutor ||
      !formulario.value.domicilio
    ) {

      errorFormulario.value =
        "Completá todos los campos obligatorios.";

      return;
    }

  }

  pasoActual.value++;

};


/* =========================================================
   GUARDAR ALUMNO
========================================================= */

const guardarAlumno = async () => {

  errorFormulario.value = "";
  errorTelefono.value = validarTelefonoAR(formulario.value.telefono_tutor, true);
  if (errorTelefono.value) {
    return;
  }

  // Defensa extra: no llamar a la API con un Gmail vacío o inválido.
  const errorEmailGuardado = validarEmail(formulario.value.email);
  if (errorEmailGuardado) {
    errorFormulario.value = errorEmailGuardado;
    return;
  }

  guardandoAlumno.value = true;

  let resultado;


  if (modoEdicion.value) {

    resultado = await modificarAlumno({
      id_alumno: alumnoEditandoId.value,
      nombre: formulario.value.nombre,
      apellido: formulario.value.apellido,
      dni: formulario.value.dni,
      fecha_nacimiento: formulario.value.fecha_nacimiento,
      email: formulario.value.email,
      nombre_tutor: formulario.value.nombre_tutor,
      telefono_tutor: formulario.value.telefono_tutor,
      domicilio: formulario.value.domicilio,
      estado: formulario.value.estado
    });

  } else if (alumnoPendienteCuenta.value !== null) {

    // Reintento: la ficha ya existe, solo falta crear/vincular la cuenta.
    resultado = {
      success: true,
      data: { id_alumno: alumnoPendienteCuenta.value }
    };

  } else {

    resultado = await crearAlumno({
      nombre: formulario.value.nombre,
      apellido: formulario.value.apellido,
      dni: formulario.value.dni,
      fecha_nacimiento: formulario.value.fecha_nacimiento,
      email: formulario.value.email,
      nombre_tutor: formulario.value.nombre_tutor,
      telefono_tutor: formulario.value.telefono_tutor,
      domicilio: formulario.value.domicilio,
      id_curso: idCurso.value
    });

  }


  if (!resultado.success) {

    errorFormulario.value =
      resultado.message || "No se pudo guardar el alumno.";

    guardandoAlumno.value = false;

    return;
  }


  // ── Cuenta de acceso (crear y editar comparten el endpoint) ──
  const idAlumno =
    resultado?.data?.id_alumno ?? resultado?.data?.data?.id_alumno ?? null;

  await datosCuentaFormulario(idAlumno);

};


/**
 * Maneja la creación/actualización de la cuenta de acceso tras guardar la
 * ficha. Si la cuenta falla, muestra el error en el modal y (si la ficha recién
 * se creó) retiene el id para reintentar al volver a "Guardar".
 */
const datosCuentaFormulario = async (idAlumno) => {

  try {

    // Panel oculto: no hay nada que crear ni actualizar.
    if (datosCuentaUsuario.value === null) {
      await finalizarGuardado();
      return;
    }

    const email = String(datosCuentaUsuario.value.email || "").trim();
    const contrasena = String(datosCuentaUsuario.value.contrasena || "").trim();
    const enviarCredenciales =
      datosCuentaUsuario.value.enviarCredenciales === true;

    if (email) {
      const errorEmailCuenta = validarEmail(email);
      if (errorEmailCuenta) {
        errorFormulario.value = errorEmailCuenta;
        return;
      }
    }

    const sinCuentaVinculada = cuentaVinculada.value === null;

    // Alta de cuenta: requiere email y contraseña (o el envío de credenciales,
    // en cuyo caso el backend genera la contraseña y la manda por email).
    if (sinCuentaVinculada && (!email || (!contrasena && !enviarCredenciales))) {
      errorFormulario.value =
        "Completá el correo y la contraseña (o marcá 'Enviar credenciales por email') " +
        "para crear la cuenta; también podés plegar la sección para guardar sin cuenta.";
      return;
    }

    // Solo llamamos a la API si hay un cambio real.
    if (
      !sinCuentaVinculada &&
      email === cuentaVinculada.value.email &&
      !contrasena &&
      !enviarCredenciales
    ) {
      await finalizarGuardado();
      return;
    }

    if (!idAlumno) {
      errorFormulario.value =
        "No se pudo identificar al alumno para actualizar su cuenta.";
      return;
    }

    const resultadoCuenta = await actualizarCuentaAlumno(idAlumno, {
      email: email || cuentaVinculada.value?.email || "",
      contrasena: contrasena || "",
      enviarCredenciales: enviarCredenciales,
    });

    if (!resultadoCuenta.success) {
      // Ficha guardada: se queda el modal para reintentar la cuenta.
      errorFormulario.value =
        resultadoCuenta.message ||
        "No se pudo actualizar la cuenta de acceso del alumno.";

      if (!modoEdicion.value && idAlumno) {
        alumnoPendienteCuenta.value = idAlumno;
      }
      return;
    }

    // La cuenta quedó guardada, pero el envío del email pudo fallar: se avisa
    // en el modal (y queda retentable presionando "Guardar" de nuevo).
    if (resultadoCuenta.data?.aviso) {
      errorFormulario.value = resultadoCuenta.data.aviso;
      if (!modoEdicion.value && idAlumno) {
        alumnoPendienteCuenta.value = idAlumno;
      }
      await cargarAlumnos();
      return;
    }

    alumnoPendienteCuenta.value = null;
    errorFormulario.value = "";

    await finalizarGuardado();

  } finally {
    guardandoAlumno.value = false;
  }

};


const finalizarGuardado = async () => {

  mostrarModalAlumno.value = false;

  await cargarAlumnos();

};


/* =========================================================
   ELIMINAR
========================================================= */

const eliminarAlumnoSeleccionado = async (alumno) => {

  const nombreCompleto =
    `${alumno.nombre} ${alumno.apellido}`;


  const confirmar = window.confirm(
    `¿Seguro que querés eliminar a ${nombreCompleto}?`
  );


  if (!confirmar) {
    return;
  }


  const resultado =
    await eliminarAlumno(alumno.id_alumno);


  if (!resultado.success) {

    window.alert(
      resultado.message ||
      "No se pudo eliminar el alumno."
    );

    return;
  }


  await cargarAlumnos();

};


/* =========================================================
   MODAL EMAIL
========================================================= */

const abrirModalEmail = (alumno) => {

  alumnoEmail.value = alumno;

  formularioEmail.value = {
    asunto: "",
    mensaje: ""
  };

  errorEmail.value = "";
  mensajeEmail.value = "";

  mostrarModalEmail.value = true;

};


const cerrarModalEmail = () => {

  if (enviandoEmail.value) {
    return;
  }

  mostrarModalEmail.value = false;

};


const enviarEmail = async () => {

  if (!alumnoEmail.value) {
    return;
  }

  errorEmail.value = "";
  mensajeEmail.value = "";

  enviandoEmail.value = true;


  const resultado = await enviarEmailAlumno(
    alumnoEmail.value.id_alumno,
    {
      asunto: formularioEmail.value.asunto,
      mensaje: formularioEmail.value.mensaje
    }
  );


  if (!resultado.success) {

    errorEmail.value =
      resultado.message ||
      "No se pudo enviar el email.";

    enviandoEmail.value = false;

    return;
  }


  mensajeEmail.value =
    resultado.data?.mensaje ||
    "Email enviado correctamente.";


  enviandoEmail.value = false;


  setTimeout(() => {

    if (mostrarModalEmail.value) {
      mostrarModalEmail.value = false;
    }

  }, 2500);

};


/* =========================================================
   MODAL COMUNICADO
========================================================= */

const abrirModalComunicado = () => {

  formularioComunicado.value = {
    titulo: "",
    mensaje: "",
    importancia: "media"
  };

  errorComunicado.value = "";
  mensajeComunicado.value = "";

  mostrarModalComunicado.value = true;

};


const cerrarModalComunicado = () => {

  if (enviandoComunicado.value) {
    return;
  }

  mostrarModalComunicado.value = false;

};


const enviarComunicado = async () => {

  if (!cursoSeleccionado.value) {
    errorComunicado.value =
      "No se encontró el curso seleccionado.";

    return;
  }

  errorComunicado.value = "";
  mensajeComunicado.value = "";

  enviandoComunicado.value = true;


  const nombreCurso =
    cursoSeleccionado.value.nombre_curso ||
    cursoSeleccionado.value.nombre;


  const resultado = await crearComunicado({

    titulo: formularioComunicado.value.titulo,
    mensaje: formularioComunicado.value.mensaje,
    importancia: formularioComunicado.value.importancia,
    destino: "curso",
    curso_destino: nombreCurso

  });


  if (!resultado.success) {

    errorComunicado.value =
      resultado.message ||
      "No se pudo publicar el comunicado.";

    enviandoComunicado.value = false;

    return;
  }


  mensajeComunicado.value =
    resultado.data?.mensaje ||
    "Comunicado publicado correctamente.";

  enviandoComunicado.value = false;


  setTimeout(() => {

    if (mostrarModalComunicado.value) {
      mostrarModalComunicado.value = false;
    }

  }, 2500);

};


/* =========================================================
   VOLVER
========================================================= */

const volverCursos = () => {

  router.push("/preceptor/cursos");

};


/* =========================================================
   INICIO
========================================================= */

onMounted(async () => {

  await cargarCurso();
  await cargarAlumnos();

});

</script>

<style src="../Alumnos.css"></style>
