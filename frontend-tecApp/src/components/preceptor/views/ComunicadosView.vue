<template>
    <div class="comunicados-page">

        <!-- =====================================================
             ENCABEZADO
        ====================================================== -->
        <section class="page-header">

            <div class="page-header-info">

                <img
                    src="/frontend-tecApp/megafono.webp"
                    alt="Comunicados"
                    class="page-header-icon"
                />

                <div>
                    <h1>Comunicados</h1>

                    <p>
                        Gestioná los comunicados enviados a alumnos,
                        familias y docentes.
                    </p>
                </div>

            </div>

            <button
                class="primary-btn"
                type="button"
                @click="abrirNuevo"
            >
                <i class="fa-solid fa-plus"></i>
                Nuevo comunicado
            </button>

        </section>


        <!-- =====================================================
             FILTROS
        ====================================================== -->
        <section class="filters-card" @click.stop>

            <div class="search-wrapper">

                <i class="fa-solid fa-magnifying-glass"></i>

                <input
                    v-model="busqueda"
                    type="text"
                    placeholder="Buscar comunicado o destinatario..."
                    @click.stop
                    @keydown.stop
                />

            </div>


            <div class="course-filters">

                <button
                    type="button"
                    class="course-filter"
                    :class="{ active: cursoSeleccionado === 'todos' }"
                    @click="cursoSeleccionado = 'todos'"
                >
                    Todos
                </button>

                <button
                    v-for="curso in cursos"
                    :key="curso.id_curso"
                    type="button"
                    class="course-filter"
                    :class="{
                        active: cursoSeleccionado === String(curso.id_curso)
                    }"
                    @click="cursoSeleccionado = String(curso.id_curso)"
                >
                    {{ curso.nombre }}
                </button>

            </div>

        </section>


        <!-- =====================================================
             HISTORIAL
        ====================================================== -->
        <section class="history-section">

            <div class="history-header">

                <div>
                    <h2>Historial de comunicaciones</h2>

                    <p>
                        {{ elementosFiltrados.length }}
                        comunicaciones registradas
                    </p>
                </div>

            </div>


            <!-- =================================================
                 TARJETAS
            ================================================== -->
            <div
                v-if="elementosFiltrados.length"
                class="communications-list"
            >

                <article
                    v-for="elemento in elementosFiltrados"
                    :key="elemento.id"
                    class="communication-card"
                    :class="{
                        'email-card': elemento.tipo === 'email'
                    }"
                >

                    <div class="card-top">

                        <div class="card-badges">

                            <span
                                v-if="elemento.tipo === 'comunicado'"
                                class="course-badge"
                            >
                                <i class="fa-solid fa-users"></i>

                                {{ textoDestino(elemento) }}
                            </span>

                            <span
                                v-else
                                class="email-badge"
                            >
                                <i class="fa-solid fa-envelope"></i>

                                Correo enviado
                            </span>


                            <span
                                v-if="elemento.tipo === 'comunicado'"
                                class="importance-badge"
                                :class="elemento.importancia"
                            >
                                {{ textoImportancia(elemento.importancia) }}
                            </span>


                            <span
                                v-else
                                class="status-badge"
                                :class="elemento.estado"
                            >
                                {{
                                    elemento.estado === "enviado"
                                        ? "Enviado"
                                        : "Fallido"
                                }}
                            </span>

                        </div>


                        <span class="card-date">
                            {{ formatearFecha(elemento.fecha) }}
                        </span>

                    </div>


                    <div class="card-content">

                        <h3>
                            {{ elemento.titulo }}
                        </h3>

                        <p>
                            {{ elemento.mensaje }}
                        </p>

                    </div>


                    <div class="card-footer">

                        <span v-if="elemento.tipo === 'comunicado'">
                            <i class="fa-solid fa-bullhorn"></i>

                            Comunicado institucional
                        </span>

                        <span v-else>
                            <i class="fa-solid fa-envelope"></i>

                            {{ elemento.destinatario }}
                        </span>


                        <button
                            type="button"
                            class="view-btn"
                            @click="abrirDetalle(elemento)"
                        >
                            <i class="fa-regular fa-eye"></i>
                            Ver detalle

                        </button>

                    </div>

                </article>

            </div>


            <!-- =================================================
                 VACÍO
            ================================================== -->
            <div
                v-else
                class="empty-state"
            >

                <div class="empty-icon">
                    <i class="fa-solid fa-inbox"></i>
                </div>

                <h3>No encontramos comunicaciones</h3>

                <p>
                    Probá con otro término de búsqueda o cambiá el filtro.
                </p>

            </div>

        </section>


<!-- =====================================================
     MODAL DETALLE
====================================================== -->

<Teleport to="body">

    <div
        v-if="detalleAbierto"
        class="modal-overlay"
        @click.self="cerrarDetalle"
    >

        <div class="modal-card">

            <div class="modal-header">

                <div>

                    <span
                        class="modal-type"
                        :class="
                            detalleAbierto.tipo === 'email'
                                ? 'email'
                                : 'comunicado'
                        "
                    >
                        {{
                            detalleAbierto.tipo === "email"
                                ? "Correo enviado"
                                : "Comunicado"
                        }}
                    </span>

                    <h2>
                        {{ detalleAbierto.titulo }}
                    </h2>

                </div>

                <button
                    type="button"
                    class="modal-close"
                    @click="cerrarDetalle"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <div class="modal-body">

                <div class="detail-grid">

                    <div class="detail-item">

                        <span class="detail-label">
                            Destinatario
                        </span>

                        <strong>
                            {{ detalleAbierto.destinatario }}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span class="detail-label">
                            Fecha
                        </span>

                        <strong>
                            {{
                                formatearFecha(
                                    detalleAbierto.fecha
                                )
                            }}
                        </strong>

                    </div>


                    <div
                        v-if="
                            detalleAbierto.tipo === 'email' &&
                            detalleAbierto.emailDestino
                        "
                        class="detail-item"
                    >

                        <span class="detail-label">
                            Correo electrónico
                        </span>

                        <strong>
                            {{ detalleAbierto.emailDestino }}
                        </strong>

                    </div>


                    <div
                        v-if="detalleAbierto.tipo === 'email'"
                        class="detail-item"
                    >

                        <span class="detail-label">
                            Estado
                        </span>

                        <strong>
                            {{
                                detalleAbierto.estado === "enviado"
                                    ? "Enviado correctamente"
                                    : "No enviado"
                            }}
                        </strong>

                    </div>

                </div>


                <div class="message-box">

                    <span class="detail-label">
                        Mensaje
                    </span>

                    <p>
                        {{ detalleAbierto.mensaje }}
                    </p>

                </div>

            </div>


            <div class="modal-footer">

                <button
                    type="button"
                    class="btn-secondary"
                    @click="cerrarDetalle"
                >
                    Cerrar
                </button>

            </div>

        </div>

    </div>

</Teleport>

<!-- =====================================================
     MODAL NUEVO / EDITAR
====================================================== -->

<Teleport to="body">

    <div
        v-show="modalFormulario"
        class="modal-overlay"
        @click.self="cerrarFormulario"
    >

        <div class="modal-card form-modal">

            <div class="modal-header">

                <div>

                    <span class="modal-type comunicado">
                        {{
                            editando
                                ? "Editar comunicado"
                                : "Nuevo comunicado"
                        }}
                    </span>

                    <h2>
                        {{
                            editando
                                ? "Editar comunicado"
                                : "Crear comunicado"
                        }}
                    </h2>

                </div>


                <button
                    type="button"
                    class="modal-close"
                    @click="cerrarFormulario"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <form
                class="new-communication-form"
                @submit.prevent="guardarComunicado"
            >

                <div class="modal-body">

                    <div class="form-group">

                        <label for="titulo">
                            Título
                        </label>

                        <input
                            id="titulo"
                            v-model="formulario.titulo"
                            type="text"
                            placeholder="Ej: Reunión de padres"
                            required
                        />

                    </div>


                    <div class="form-group">

                        <label for="mensaje">
                            Mensaje
                        </label>

                        <textarea
                            id="mensaje"
                            v-model="formulario.mensaje"
                            rows="5"
                            placeholder="Escribí el contenido del comunicado..."
                            required
                        ></textarea>

                    </div>


                    <div class="form-group">

                        <label for="importancia">
                            Importancia
                        </label>

                        <select
                            id="importancia"
                            v-model="formulario.importancia"
                        >

                            <option value="baja">
                                Baja
                            </option>

                            <option value="media">
                                Media
                            </option>

                            <option value="alta">
                                Alta
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label for="destino">
                            Destinatarios
                        </label>

                        <select
                            id="destino"
                            v-model="formulario.destino"
                        >

                            <option value="todos">
                                Todos
                            </option>

                            <option value="profesores">
                                Profesores
                            </option>

                            <option value="alumnos">
                                Alumnos
                            </option>

                            <option value="autoridades">
                                Autoridades
                            </option>

                            <option value="curso">
                                Un curso
                            </option>

                        </select>

                    </div>


                    <div
                        v-if="formulario.destino === 'curso'"
                        class="form-group"
                    >

                        <label for="curso">
                            Curso
                        </label>

                        <select
                            id="curso"
                            v-model="formulario.curso_destino"
                            required
                        >

                            <option value="">
                                Seleccioná un curso
                            </option>

                            <option
                                v-for="curso in cursos"
                                :key="curso.id_curso"
                                :value="String(curso.id_curso)"
                            >
                                {{ curso.nombre }}
                            </option>

                        </select>

                    </div>

                </div>


                <div class="modal-footer">

                    <button
                        type="button"
                        class="btn-secondary"
                        @click="cerrarFormulario"
                    >
                        Cancelar
                    </button>


                    <button
                        type="submit"
                        class="btn-primary"
                    >
                        {{
                            editando
                                ? "Guardar cambios"
                                : "Publicar comunicado"
                        }}
                    </button>

                </div>

            </form>

        </div>

    </div>

</Teleport>
        <!-- =====================================================
             TOAST
        ====================================================== -->
        <div
            v-if="toast.visible"
            class="toast"
            :class="toast.tipo"
        >

            <i
                :class="
                    toast.tipo === 'success'
                        ? 'fa-solid fa-circle-check'
                        : 'fa-solid fa-circle-xmark'
                "
            ></i>

            <span>
                {{ toast.mensaje }}
            </span>

        </div>

    </div>
</template>


<script setup>
import {
    computed,
    ref,
    onMounted
} from "vue";

import "../Comunicados.css";

import {
    obtenerCursos,
    obtenerAlumnos,
    obtenerComunicados,
    obtenerCorreosEnviados,
    crearComunicado,
    modificarComunicado
} from "@/services/academico-service.js";

import {
    useAuthStore
} from "@/stores/auth.js";


/* =========================================================
   AUTENTICACIÓN
========================================================= */

const authStore = useAuthStore();


/* =========================================================
   DATOS
========================================================= */

const cursos = ref([]);

const alumnos = ref([]);

const comunicados = ref([]);

const emails = ref([]);


/* =========================================================
   FILTROS
========================================================= */

const busqueda = ref("");

const cursoSeleccionado = ref("todos");


/* =========================================================
   MODALES
========================================================= */

const detalleAbierto = ref(null);

const modalFormulario = ref(false);


/* =========================================================
   EDICIÓN
========================================================= */

const editando = ref(false);

const idEditando = ref(null);


/* =========================================================
   ESTADOS
========================================================= */

const cargando = ref(false);

const guardando = ref(false);

const error = ref("");


/* =========================================================
   FORMULARIO
========================================================= */

const formularioInicial = () => ({
    titulo: "",
    mensaje: "",
    importancia: "media",
    destino: "todos",
    curso_destino: ""
});


const formulario = ref(
    formularioInicial()
);


/* =========================================================
   TOAST
========================================================= */

const toast = ref({
    visible: false,
    mensaje: "",
    tipo: "success"
});


let toastTimeout = null;


/* =========================================================
   CARGAR DATOS
========================================================= */

const cargarDatos = async () => {

    cargando.value = true;

    error.value = "";


    try {

        const resultados = await Promise.allSettled([
            obtenerCursos(),
            obtenerAlumnos(),
            obtenerComunicados(),
            obtenerCorreosEnviados()
        ]);


        /* =====================================================
           CURSOS
        ===================================================== */

        const resultadoCursos = resultados[0];

        if (
            resultadoCursos.status === "fulfilled" &&
            resultadoCursos.value?.success
        ) {

            cursos.value =
                resultadoCursos.value.data || [];

        } else {

            cursos.value = [];

        }


        /* =====================================================
           ALUMNOS
        ===================================================== */

        const resultadoAlumnos = resultados[1];

        if (
            resultadoAlumnos.status === "fulfilled" &&
            resultadoAlumnos.value?.success
        ) {

            alumnos.value =
                resultadoAlumnos.value.data || [];

        } else {

            alumnos.value = [];

        }


        /* =====================================================
           COMUNICADOS
        ===================================================== */

        const resultadoComunicados = resultados[2];

        if (
            resultadoComunicados.status === "fulfilled" &&
            resultadoComunicados.value?.success
        ) {

            comunicados.value =
                resultadoComunicados.value.data || [];

        } else {

            comunicados.value = [];

        }


        /* =====================================================
           CORREOS
        ===================================================== */

        const resultadoEmails = resultados[3];

        if (
            resultadoEmails.status === "fulfilled" &&
            resultadoEmails.value?.success
        ) {

            emails.value =
                resultadoEmails.value.data || [];

        } else {

            emails.value = [];

        }

    } catch (e) {

        console.error(
            "Error cargando Comunicados:",
            e
        );

        /*
         * Aunque todavía no haya base de datos,
         * la página sigue funcionando.
         */

        cursos.value = [];

        alumnos.value = [];

        comunicados.value = [];

        emails.value = [];

    } finally {

        cargando.value = false;

    }

};


/* =========================================================
   ALUMNOS
========================================================= */

const obtenerAlumno = (idAlumno) => {

    return alumnos.value.find(
        (alumno) =>
            String(alumno.id_alumno) ===
            String(idAlumno)
    );

};


const nombreAlumno = (idAlumno) => {

    const alumno =
        obtenerAlumno(idAlumno);


    if (!alumno) {

        return "Alumno";

    }


    const nombreCompleto =
        `${alumno.nombre || ""} ${alumno.apellido || ""}`
            .trim();


    return (
        nombreCompleto ||
        "Alumno"
    );

};


/* =========================================================
   CURSOS
========================================================= */

const obtenerCurso = (idCurso) => {

    return cursos.value.find(
        (curso) =>
            String(curso.id_curso) ===
            String(idCurso)
    );

};


const nombreCurso = (idCurso) => {

    const curso =
        obtenerCurso(idCurso);


    if (!curso) {

        return "Curso";

    }


    return (
        curso.nombre ||
        curso.nombre_curso ||
        "Curso"
    );

};


/* =========================================================
   CURSO DEL ALUMNO
========================================================= */

const obtenerCursoAlumno = (idAlumno) => {

    const alumno =
        obtenerAlumno(idAlumno);


    if (!alumno) {

        return null;

    }


    return (
        alumno.id_curso ??
        alumno.cursoId ??
        alumno.curso_id ??
        null
    );

};


/* =========================================================
   MAPEAR COMUNICADO
========================================================= */

const mapearComunicado = (comunicado) => {

    return {

        id:
            `comunicado-${comunicado.id_comunicado}`,

        tipo:
            "comunicado",

        id_comunicado:
            comunicado.id_comunicado,

        titulo:
            comunicado.titulo || "",

        mensaje:
            comunicado.mensaje || "",

        importancia:
            comunicado.importancia || "media",

        destino:
            comunicado.destino || "todos",

        curso_destino:
            comunicado.curso_destino,

        destinatario:
            comunicado.destino === "curso"
                ? nombreCurso(
                    comunicado.curso_destino
                )
                : textoDestino(
                    comunicado
                ),

        fecha:
            comunicado.fecha_publicacion

    };

};


/* =========================================================
   MAPEAR EMAIL
========================================================= */

const mapearEmail = (email) => {

    return {

        id:
            `email-${email.id_correo}`,

        tipo:
            "email",

        id_correo:
            email.id_correo,

        id_destinatario:
            email.id_destinatario,

        titulo:
            email.asunto || "",

        mensaje:
            email.cuerpo || "",

        destinatario:
            nombreAlumno(
                email.id_destinatario
            ),

        emailDestino:
            email.email_destino || "",

        estado:
            email.estado || "enviado",

        fecha:
            email.fecha_envio

    };

};


/* =========================================================
   ELEMENTOS
========================================================= */

const elementos = computed(() => {

    const listaComunicados =
        comunicados.value.map(
            mapearComunicado
        );


    const listaEmails =
        emails.value.map(
            mapearEmail
        );


    return [
        ...listaComunicados,
        ...listaEmails
    ].sort(
        (a, b) =>
            new Date(b.fecha || 0) -
            new Date(a.fecha || 0)
    );

});


/* =========================================================
   FILTRAR
========================================================= */

const elementosFiltrados = computed(() => {

    const texto =
        busqueda.value
            .trim()
            .toLowerCase();


    return elementos.value.filter(
        (elemento) => {

            const coincideTexto =
                !texto ||

                elemento.titulo
                    ?.toLowerCase()
                    .includes(texto) ||

                elemento.mensaje
                    ?.toLowerCase()
                    .includes(texto) ||

                elemento.destinatario
                    ?.toLowerCase()
                    .includes(texto) ||

                elemento.emailDestino
                    ?.toLowerCase()
                    .includes(texto);


            if (!coincideTexto) {

                return false;

            }


            if (
                cursoSeleccionado.value ===
                "todos"
            ) {

                return true;

            }


            if (
                elemento.tipo ===
                "comunicado"
            ) {

                if (
                    elemento.destino ===
                    "curso"
                ) {

                    return (
                        String(
                            elemento.curso_destino
                        ) ===
                        String(
                            cursoSeleccionado.value
                        )
                    );

                }


                return true;

            }


            const cursoAlumno =
                obtenerCursoAlumno(
                    elemento.id_destinatario
                );


            return (
                String(cursoAlumno) ===
                String(
                    cursoSeleccionado.value
                )
            );

        }
    );

});


/* =========================================================
   TEXTO IMPORTANCIA
========================================================= */

const textoImportancia = (importancia) => {

    const textos = {
        baja: "Baja",
        media: "Media",
        alta: "Alta"
    };


    return (
        textos[importancia] ||
        importancia ||
        "Importancia"
    );

};


/* =========================================================
   TEXTO DESTINO
========================================================= */

const textoDestino = (elemento) => {

    if (
        elemento.destino ===
        "todos"
    ) {

        return "Todos";

    }


    if (
        elemento.destino ===
        "profesores"
    ) {

        return "Profesores";

    }


    if (
        elemento.destino ===
        "alumnos"
    ) {

        return "Alumnos";

    }


    if (
        elemento.destino ===
        "autoridades"
    ) {

        return "Autoridades";

    }


    if (
        elemento.destino ===
        "curso"
    ) {

        return nombreCurso(
            elemento.curso_destino
        );

    }


    return "Destinatarios";

};


/* =========================================================
   FECHA
========================================================= */

const formatearFecha = (fecha) => {

    if (!fecha) {

        return "";

    }


    const date =
        new Date(fecha);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return fecha;

    }


    return new Intl.DateTimeFormat(
        "es-AR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

};


/* =========================================================
   MODAL DETALLE
========================================================= */

const abrirDetalle = (elemento) => {

    detalleAbierto.value =
        elemento;

};


const cerrarDetalle = () => {

    detalleAbierto.value =
        null;

};


/* =========================================================
   MODAL NUEVO
========================================================= */

const abrirNuevo = () => {

    console.log(
        "Nuevo comunicado: abrir modal"
    );


    editando.value = false;

    idEditando.value = null;

    formulario.value =
        formularioInicial();


    /*
     * IMPORTANTE:
     * El modal depende solamente de esta variable.
     * No depende de cursos, alumnos ni base de datos.
     */

    modalFormulario.value = true;

};


/* =========================================================
   MODAL EDITAR
========================================================= */

const abrirEditar = (elemento) => {

    editando.value = true;

    idEditando.value =
        elemento.id_comunicado;


    formulario.value = {

        titulo:
            elemento.titulo || "",

        mensaje:
            elemento.mensaje || "",

        importancia:
            elemento.importancia ||
            "media",

        destino:
            elemento.destino ||
            "todos",

        curso_destino:
            elemento.curso_destino
                ? String(
                    elemento.curso_destino
                )
                : ""

    };


    modalFormulario.value = true;

};


/* =========================================================
   CERRAR FORMULARIO
========================================================= */

const cerrarFormulario = () => {

    if (guardando.value) {

        return;

    }


    modalFormulario.value = false;

    editando.value = false;

    idEditando.value = null;

    formulario.value =
        formularioInicial();

};


/* =========================================================
   GUARDAR COMUNICADO
========================================================= */

const guardarComunicado = async () => {

    if (guardando.value) {

        return;

    }


    if (
        !formulario.value.titulo.trim() ||
        !formulario.value.mensaje.trim()
    ) {

        mostrarToast(
            "Completá el título y el mensaje.",
            "error"
        );

        return;

    }


    if (
        formulario.value.destino ===
        "curso" &&
        !formulario.value.curso_destino
    ) {

        mostrarToast(
            "Seleccioná un curso.",
            "error"
        );

        return;

    }


    const autorId =
        authStore.usuario?.id_usuario ??
        authStore.usuario?.id ??
        null;


    /*
     * Mientras trabajamos sin base de datos,
     * permitimos que el modal funcione.
     *
     * La validación del usuario se hace solamente
     * cuando realmente intentamos guardar.
     */

    if (!autorId) {

        mostrarToast(
            "No hay un usuario autenticado para guardar el comunicado.",
            "error"
        );

        return;

    }


    guardando.value = true;


    try {

        /* =====================================================
           EDITAR
        ===================================================== */

        if (editando.value) {

            const resultado =
                await modificarComunicado(
                    idEditando.value,
                    {

                        titulo:
                            formulario.value.titulo,

                        mensaje:
                            formulario.value.mensaje,

                        importancia:
                            formulario.value.importancia,

                        destino:
                            formulario.value.destino,

                        curso_destino:
                            formulario.value.destino ===
                            "curso"

                                ? formulario.value.curso_destino

                                : null

                    }
                );


            if (!resultado.success) {

                mostrarToast(
                    resultado.message ||
                    resultado.mensaje ||
                    "No se pudo modificar el comunicado.",
                    "error"
                );

                return;

            }


            cerrarFormulario();


            mostrarToast(
                "Comunicado actualizado correctamente."
            );


            await cargarDatos();

            return;

        }


        /* =====================================================
           CREAR
        ===================================================== */

        const resultado =
            await crearComunicado(
                {

                    titulo:
                        formulario.value.titulo,

                    mensaje:
                        formulario.value.mensaje,

                    importancia:
                        formulario.value.importancia,

                    destino:
                        formulario.value.destino,

                    curso_destino:
                        formulario.value.destino ===
                        "curso"

                            ? formulario.value.curso_destino

                            : null,

                    autor_id:
                        autorId

                }
            );


        if (!resultado.success) {

            mostrarToast(
                resultado.message ||
                resultado.mensaje ||
                "No se pudo crear el comunicado.",
                "error"
            );

            return;

        }


        cerrarFormulario();


        mostrarToast(
            "Comunicado publicado correctamente."
        );


        await cargarDatos();

    } catch (e) {

        console.error(
            "Error guardando comunicado:",
            e
        );


        mostrarToast(
            "Ocurrió un error al guardar el comunicado.",
            "error"
        );

    } finally {

        guardando.value = false;

    }

};


/* =========================================================
   TOAST
========================================================= */

const mostrarToast = (
    mensaje,
    tipo = "success"
) => {

    toast.value = {

        visible: true,

        mensaje,

        tipo

    };


    if (toastTimeout) {

        clearTimeout(
            toastTimeout
        );

    }


    toastTimeout =
        setTimeout(() => {

            toast.value.visible =
                false;

        }, 3000);

};


/* =========================================================
   INICIO
========================================================= */

onMounted(() => {

    cargarDatos();

});
</script>
