import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import {
  claseImportancia,
  extraerComunicados,
  nombreAutor,
  textoDestino,
  textoImportancia,
} from "../src/utils/comunicados.js";

// Forma real de `GET /api/comunidad/comunicados`.
const COMUNICADO = {
  id_comunicado: 3,
  titulo: "Aviso evaluacion final",
  mensaje: "Comunicado de aviso sobre la evaluacion final",
  importancia: "alta",
  destino: "alumnos",
  curso_destino: null,
  fecha_publicacion: "2026-10-01T00:23:18.000Z",
  autor_id: 2,
  autor: { id_usuario: 2, nombre: "Profesor", apellido: "Demo", id_rol: 3 },
};

describe("utils/comunicados", () => {
  it("extrae el array desde las tres formas de respuesta del servicio", () => {
    expect(extraerComunicados([COMUNICADO])).toEqual([COMUNICADO]);
    expect(extraerComunicados({ success: true, data: [COMUNICADO] })).toEqual([COMUNICADO]);
    expect(extraerComunicados({ success: false })).toEqual([]);
    expect(extraerComunicados(undefined)).toEqual([]);
  });

  it("usa los nombres de campo reales de la tabla comunicados", () => {
    expect(nombreAutor(COMUNICADO)).toBe("Profesor Demo");
    expect(textoDestino(COMUNICADO)).toBe("Alumnos");
    expect(textoImportancia(COMUNICADO.importancia)).toBe("Alta");
    expect(claseImportancia("alta")).toBe("badge-alta");
  });

  it("cae a textos neutros cuando falta el autor o el destino", () => {
    expect(nombreAutor({ autor_id: null })).toBe("Comunicado de la institución");
    expect(nombreAutor(null)).toBe("Comunicado de la institución");
    expect(textoDestino({ destino: "curso", curso_destino: "1º Año" })).toBe("Curso: 1º Año");
    expect(textoDestino({ destino: "curso", curso_destino: null })).toBe("Curso específico");
    expect(textoDestino({})).toBe("General");
  });
});

describe("CursosView (alumno) - comunicados", () => {
  let obtenerTodosComunicados;
  let obtenerMisMaterias;
  let obtenerMisParticipantes;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    setActivePinia(createPinia());

    const comunidad = await import("../src/services/comunidad-service.js");
    const academico = await import("../src/services/academico-service.js");
    obtenerTodosComunicados = vi.spyOn(comunidad, "obtenerTodosComunicados");
    vi.spyOn(comunidad, "marcarComunicadoLeido").mockResolvedValue({ success: true });
    obtenerMisMaterias = vi.spyOn(academico, "obtenerMisMaterias");
    obtenerMisMaterias.mockResolvedValue([]);
    obtenerMisParticipantes = vi.spyOn(academico, "obtenerMisParticipantes");
    obtenerMisParticipantes.mockResolvedValue({
      success: true,
      data: { curso: null, companeros: [], profesores: [] },
    });
    obtenerTodosComunicados.mockResolvedValue({ success: true, data: [COMUNICADO] });

    localStorage.setItem("alumno", JSON.stringify({ curso: { nombre_curso: "1º Año" } }));
  });

  const montar = async () => {
    const { default: CursosView } = await import(
      "../src/components/alumno/views/CursosView.vue"
    );
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: { template: "<div />" } }],
    });
    await router.push("/");
    await router.isReady();
    const wrapper = mount(CursosView, { global: { plugins: [createPinia(), router] } });
    await flushPromises();
    return wrapper;
  };

  it("muestra título, mensaje, fecha y autor del comunicado", async () => {
    const wrapper = await montar();

    const texto = wrapper.text();
    expect(texto).toContain("Aviso evaluacion final");
    // El bug: antes se leía `c.contenido`, campo inexistente, y sólo aparecía
    // el título.
    expect(texto).toContain("Comunicado de aviso sobre la evaluacion final");
    // Antes se leía `c.fecha` (undefined) y `c.profesor` (inexistente).
    expect(texto).toContain("Profesor Demo");
    expect(texto).not.toContain("Sin fecha");
    expect(texto).toContain("Alumnos");
    expect(texto).toContain("Alta");
  });

  it("el cuerpo del comunicado está en el DOM y se despliega al hacer clic", async () => {
    const wrapper = await montar();
    const cuerpo = wrapper.find(".comunicado-cuerpo");
    expect(cuerpo.text()).toContain("Comunicado de aviso sobre la evaluacion final");

    expect(wrapper.find(".comunicado-card").classes()).not.toContain("abierto");
    await wrapper.find(".comunicado-header").trigger("click");
    expect(wrapper.find(".comunicado-card").classes()).toContain("abierto");
  });

  it("pide el curso del alumno para refinar el filtro", async () => {
    await montar();
    expect(obtenerTodosComunicados).toHaveBeenCalledWith({
      rol: "alumno",
      curso: "1º Año",
    });
  });

  it("muestra estado vacío si el servicio falla", async () => {
    obtenerTodosComunicados.mockResolvedValue({ success: false, message: "boom" });
    const wrapper = await montar();
    expect(wrapper.find(".seccion-error").text()).toContain("boom");
    expect(wrapper.find(".comunicado-card").exists()).toBe(false);
  });

  it("muestra compañeros y docentes del curso en la pestaña de participantes", async () => {
    obtenerMisParticipantes.mockResolvedValue({
      success: true,
      data: {
        curso: { id_curso: 4, nombre_curso: "2º Año A" },
        companeros: [{ nombre: "Ana", apellido: "Pérez" }],
        profesores: [{
          nombre: "Laura",
          apellido: "Gómez",
          es_titular: true,
          materias: ["Matemática", "Física"],
        }],
      },
    });
    const wrapper = await montar();

    await wrapper.findAll(".tab-btn")[2].trigger("click");
    expect(wrapper.find(".participantes-section").text()).toContain("2º Año A");
    expect(wrapper.find(".participantes-section").text()).toContain("Pérez, Ana");
    expect(wrapper.find(".participantes-section").text()).toContain("Gómez, Laura");
    expect(wrapper.find(".participantes-section").text()).toContain("Profesor titular");
    expect(wrapper.find(".participantes-section").text()).toContain("Matemática · Física");
    expect(obtenerMisParticipantes).toHaveBeenCalledOnce();
  });
});

describe("NoticiaView (alumno) - confirmación de lectura", () => {
  let marcarComunicadoLeido;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    setActivePinia(createPinia());

    const comunidad = await import("../src/services/comunidad-service.js");
    vi.spyOn(comunidad, "obtenerNoticiasConEstado").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(comunidad, "obtenerTodosComunicados").mockResolvedValue({
      success: true,
      data: [{ ...COMUNICADO, destino: "todos" }],
    });
    marcarComunicadoLeido = vi.spyOn(comunidad, "marcarComunicadoLeido");
    marcarComunicadoLeido.mockResolvedValue({ success: true });
  });

  it("marca un comunicado corto que se muestra completo, aunque no tenga Ver más", async () => {
    const { default: NoticiaView } = await import(
      "../src/components/alumno/views/NoticiaView.vue"
    );
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: { template: "<div />" } }],
    });
    await router.push("/");
    await router.isReady();
    const wrapper = mount(NoticiaView, {
      global: { plugins: [createPinia(), router] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain(COMUNICADO.mensaje);
    expect(wrapper.find(".ver-mas-btn").exists()).toBe(false);
    expect(marcarComunicadoLeido).toHaveBeenCalledWith(COMUNICADO.id_comunicado);
  });
});

describe("ComunicadosView (profesor) - creación", () => {
  let crearComunicado;
  let obtenerTodosComunicados;
  let obtenerAsignacionesProfesor;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    setActivePinia(createPinia());
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("usuario", JSON.stringify({ id: 2, nombre_rol: "profesor" }));

    const comunidad = await import("../src/services/comunidad-service.js");
    const academico = await import("../src/services/academico-service.js");

    crearComunicado = vi.spyOn(comunidad, "crearComunicado");
    obtenerTodosComunicados = vi.spyOn(comunidad, "obtenerTodosComunicados");
    obtenerAsignacionesProfesor = vi.spyOn(academico, "obtenerAsignacionesProfesor");

    // `resolverIdProfesor` lee el id_profesor de localStorage["alumno"].
    localStorage.setItem("alumno", JSON.stringify({ id_profesor: 1 }));

    obtenerAsignacionesProfesor.mockResolvedValue({
      success: true,
      data: [
        {
          id_asignacion: 1,
          cursoAsignacion: { nombre_curso: "1º Año" },
          materiaAsignacion: { nombre_materia: "Matematica" },
        },
      ],
    });
    obtenerTodosComunicados.mockResolvedValue({ success: true, data: [COMUNICADO] });
  });

  const montar = async () => {
    const { default: ComunicadosView } = await import(
      "../src/components/profesores/views/ComunicadosView.vue"
    );
    const wrapper = mount(ComunicadosView, { global: { plugins: [createPinia()] } });
    await flushPromises();
    return wrapper;
  };

  const completarFormulario = async (wrapper) => {
    await wrapper.find('button.tb-btn.primary.sm').trigger("click");
    await wrapper.find('input[type="text"]').setValue("Reunión de padres");
    await wrapper.find("textarea").setValue("Mañana a las 10 hs en el aula 101.");
    await wrapper.find("form").trigger("submit");
    await flushPromises();
  };

  it("publica y sólo entonces muestra el éxito", async () => {
    crearComunicado.mockResolvedValue({ success: true, data: { id_comunicado: 9 } });
    const wrapper = await montar();
    await completarFormulario(wrapper);

    expect(crearComunicado).toHaveBeenCalledTimes(1);
    expect(crearComunicado.mock.calls[0][0]).toEqual({
      titulo: "Reunión de padres",
      mensaje: "Mañana a las 10 hs en el aula 101.",
      importancia: "media",
      destino: "todos",
      curso_destino: null,
      autor_id: 2,
    });
    expect(wrapper.find(".form-success").text()).toContain(
      "Comunicado publicado correctamente",
    );
  });

  it("muestra el error de la API y deja el formulario abierto", async () => {
    crearComunicado.mockResolvedValue({
      success: false,
      status: 403,
      message: "Acceso denegado: No tenés el permiso necesario -> (comunicado_crear)",
    });
    const wrapper = await montar();
    await completarFormulario(wrapper);

    expect(wrapper.find(".form-error").text()).toContain("Acceso denegado");
    // Antes el `try` nunca entraba porque `crearComunicado` no lanza: se
    // reportaba éxito siempre y el form se cerraba.
    expect(wrapper.find(".form-success").exists()).toBe(false);
    expect(wrapper.find("form").exists()).toBe(true);
  });

  it("no manda id_asignacion ni id_curso: no existen en la tabla", async () => {
    crearComunicado.mockResolvedValue({ success: true, data: {} });
    const wrapper = await montar();
    await completarFormulario(wrapper);

    const payload = crearComunicado.mock.calls[0][0];
    expect(payload).not.toHaveProperty("id_asignacion");
    expect(payload).not.toHaveProperty("id_curso");
  });

  it("el historial lista los comunicados con autor y marca los propios", async () => {
    crearComunicado.mockResolvedValue({ success: true, data: {} });
    const wrapper = await montar();

    expect(obtenerTodosComunicados).toHaveBeenCalledWith({
      rol: "profesor",
      cursos: "1º Año",
    });
    const texto = wrapper.text();
    expect(texto).toContain("Aviso evaluacion final");
    expect(texto).toContain("Comunicado de aviso sobre la evaluacion final");
    expect(texto).toContain("Profesor Demo");
    expect(texto).toContain("Publicaste vos");
  });
});

describe("ComunicadosView (preceptor) - destino curso", () => {
  let crearComunicado;
  let obtenerComunicados;
  let eliminarComunicado;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    setActivePinia(createPinia());
    localStorage.setItem("token", "token-preceptor");
    localStorage.setItem("usuario", JSON.stringify({ id_usuario: 44, nombre_rol: "preceptor" }));

    const academico = await import("../src/services/academico-service.js");
    const comunidad = await import("../src/services/comunidad-service.js");
    vi.spyOn(academico, "obtenerCursosPreceptor").mockResolvedValue({
      success: true,
      data: [{ id_curso: 55, nombre_curso: "2do 3ra" }],
    });
    vi.spyOn(academico, "obtenerAlumnosCurso").mockResolvedValue({ success: true, data: [] });
    obtenerComunicados = vi.spyOn(academico, "obtenerComunicados").mockResolvedValue({ success: true, data: [] });
    eliminarComunicado = vi.spyOn(academico, "eliminarComunicado").mockResolvedValue({ success: true, data: {} });
    vi.spyOn(academico, "obtenerCorreosEnviados").mockResolvedValue({ success: true, data: [] });
    crearComunicado = vi.spyOn(academico, "crearComunicado").mockResolvedValue({
      success: true,
      data: { id_comunicado: 77 },
    });
    vi.spyOn(academico, "modificarComunicado").mockResolvedValue({ success: true, data: {} });
    vi.spyOn(comunidad, "obtenerResumenLecturas").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(comunidad, "marcarComunicadoLeido").mockResolvedValue({ success: true });
    vi.spyOn(comunidad, "obtenerTodosComunicados").mockResolvedValue({ success: true, data: [] });
  });

  it("envía el nombre exacto del curso seleccionado al crear el comunicado", async () => {
    const { default: ComunicadosView } = await import(
      "../src/components/preceptor/views/ComunicadosView.vue"
    );
    const wrapper = mount(ComunicadosView, { global: { plugins: [createPinia()] } });
    await flushPromises();

    await wrapper.find("button.primary-btn").trigger("click");
    await flushPromises();

    const setValue = (selector, value, eventName) => {
      const elemento = document.body.querySelector(selector);
      elemento.value = value;
      elemento.dispatchEvent(new Event(eventName, { bubbles: true }));
    };
    setValue("#titulo", "Reunión de curso", "input");
    setValue("#mensaje", "El viernes a las 10 hs", "input");
    setValue("#destino", "curso", "change");
    await flushPromises();
    setValue("#curso", "2do 3ra", "change");
    document.body.querySelector("form").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await flushPromises();

    expect(crearComunicado).toHaveBeenCalledWith({
      titulo: "Reunión de curso",
      mensaje: "El viernes a las 10 hs",
      importancia: "media",
      destino: "curso",
      curso_destino: "2do 3ra",
      autor_id: 44,
    });
    wrapper.unmount();
  });

  it("confirma y elimina un comunicado dirigido a un curso, luego refresca el historial", async () => {
    obtenerComunicados.mockResolvedValueOnce({
      success: true,
      data: [{
        id_comunicado: 77,
        titulo: "Reunión de curso",
        mensaje: "El viernes a las 10 hs",
        destino: "curso",
        curso_destino: "2do 3ra",
        importancia: "media",
        fecha_publicacion: "2026-10-20T10:00:00.000Z",
      }],
    });
    const { default: ComunicadosView } = await import(
      "../src/components/preceptor/views/ComunicadosView.vue"
    );
    const wrapper = mount(ComunicadosView, { global: { plugins: [createPinia()] } });
    await flushPromises();

    expect(wrapper.findAll(".delete-course-announcement")).toHaveLength(1);
    await wrapper.find(".delete-course-announcement").trigger("click");
    const confirm = document.body.querySelector('[role="dialog"]');
    expect(confirm.textContent).toContain("Reunión de curso");
    confirm.querySelector(".btn-danger").click();
    await flushPromises();

    expect(eliminarComunicado).toHaveBeenCalledWith(77);
    expect(obtenerComunicados).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain("Comunicado eliminado correctamente.");
    wrapper.unmount();
  });

  it("permite cancelar la eliminación y presenta el error de la API", async () => {
    obtenerComunicados.mockResolvedValueOnce({
      success: true,
      data: [{
        id_comunicado: 78,
        titulo: "Aviso de curso",
        mensaje: "Mensaje",
        destino: "curso",
        curso_destino: "2do 3ra",
        importancia: "media",
        fecha_publicacion: "2026-10-20T10:00:00.000Z",
      }],
    });
    eliminarComunicado.mockResolvedValueOnce({ success: false, message: "Acceso denegado" });
    const { default: ComunicadosView } = await import(
      "../src/components/preceptor/views/ComunicadosView.vue"
    );
    const wrapper = mount(ComunicadosView, { global: { plugins: [createPinia()] } });
    await flushPromises();

    await wrapper.find(".delete-course-announcement").trigger("click");
    document.body.querySelector('[role="dialog"] .btn-secondary').click();
    await flushPromises();
    expect(eliminarComunicado).not.toHaveBeenCalled();

    await wrapper.find(".delete-course-announcement").trigger("click");
    document.body.querySelector('[role="dialog"] .btn-danger').click();
    await flushPromises();
    expect(eliminarComunicado).toHaveBeenCalledWith(78);
    expect(wrapper.text()).toContain("Acceso denegado");
    wrapper.unmount();
  });
});
