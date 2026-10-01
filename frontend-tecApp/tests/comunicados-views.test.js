import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
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

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    setActivePinia(createPinia());

    const comunidad = await import("../src/services/comunidad-service.js");
    const academico = await import("../src/services/academico-service.js");
    obtenerTodosComunicados = vi.spyOn(comunidad, "obtenerTodosComunicados");
    obtenerMisMaterias = vi.spyOn(academico, "obtenerMisMaterias");
    obtenerMisMaterias.mockResolvedValue([]);
    obtenerTodosComunicados.mockResolvedValue({ success: true, data: [COMUNICADO] });

    localStorage.setItem("alumno", JSON.stringify({ curso: { nombre_curso: "1º Año" } }));
  });

  const montar = async () => {
    const { default: CursosView } = await import(
      "../src/components/alumno/views/CursosView.vue"
    );
    const wrapper = mount(CursosView, { global: { plugins: [createPinia()] } });
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
    expect(wrapper.find(".comunicados-vacio").exists()).toBe(true);
    expect(wrapper.find(".comunicado-card").exists()).toBe(false);
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