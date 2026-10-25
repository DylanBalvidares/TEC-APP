import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";

const academico = vi.hoisted(() => ({
  obtenerCursosPreceptor: vi.fn(),
  obtenerNotasPreceptorCurso: vi.fn(),
  obtenerHistorialNotasAlumno: vi.fn(),
  obtenerNotasProfesor: vi.fn(),
  obtenerCursos: vi.fn(),
  obtenerPlanillaAdmin: vi.fn(),
  modificarNotaService: vi.fn(),
  eliminarNotaService: vi.fn(),
  guardarNota: vi.fn(),
  obtenerSolicitudesEdicionPreceptor: vi.fn(),
  solicitarEdicionPlanilla: vi.fn(),
  obtenerAccesosEdicionProfesor: vi.fn(),
  decidirSolicitudEdicion: vi.fn(),
}));

vi.mock("../src/services/academico-service.js", () => academico);

const curso = { id_curso: 4, nombre_curso: "2º A", nivel: "Ciclo básico", turno: "Mañana" };
const asignacion = {
  id_asignacion: 12,
  id_curso: 4,
  id_profesor: 8,
  cursoAsignacion: curso,
  materiaAsignacion: { nombre_materia: "Matemática" },
};
const alumnos = [
  { id_alumno: 8, id_curso: 4, nombre: "Ana", apellido: "Pérez", dni: "123" },
  { id_alumno: 9, id_curso: 4, nombre: "Zoe", apellido: "Gómez", dni: "456" },
];

const montados = [];
const montar = async (ruta) => {
  const componente = (await import(ruta)).default;
  const wrapper = mount(componente);
  montados.push(wrapper);
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.clearAllMocks();
  academico.obtenerCursosPreceptor.mockResolvedValue({ success: true, data: [curso] });
  academico.obtenerNotasPreceptorCurso.mockResolvedValue({
    success: true,
    data: {
      curso,
      alumnos,
      asignaciones: [asignacion],
      notas: [{ id_nota: 1, id_alumno: 8, id_asignacion: 12, calificacion: 7.5 }],
    },
  });
  academico.obtenerHistorialNotasAlumno.mockResolvedValue({ success: true, data: [] });
  academico.obtenerSolicitudesEdicionPreceptor.mockResolvedValue({ success: true, data: [] });
  academico.solicitarEdicionPlanilla.mockResolvedValue({ success: true, data: { id_solicitud: 4 } });
  academico.guardarNota.mockResolvedValue({ success: true, data: { id_nota: 2, id_alumno: 9, id_asignacion: 12, calificacion: 8.5 } });
  academico.obtenerNotasProfesor.mockResolvedValue({
    success: true,
    data: {
      asignaciones: [asignacion],
      alumnos,
      notas: [{ id_nota: 1, id_alumno: 8, id_asignacion: 12, calificacion: 7.5 }],
    },
  });
  academico.obtenerCursos.mockResolvedValue({ success: true, data: [curso] });
  academico.obtenerPlanillaAdmin.mockResolvedValue({
    success: true,
    data: { curso, alumnos, asignaciones: [asignacion], notas: [] },
  });
  academico.modificarNotaService.mockResolvedValue({ success: true, data: {} });
  academico.eliminarNotaService.mockResolvedValue({ success: true, data: {} });
  academico.obtenerAccesosEdicionProfesor.mockResolvedValue({ success: true, data: [] });
  academico.decidirSolicitudEdicion.mockResolvedValue({ success: true, data: {} });
});

afterEach(() => {
  for (const wrapper of montados) wrapper.unmount();
  montados.length = 0;
});

describe("Libreta Digital del Preceptor", () => {
  it("filtra alumnos y permite pedir autorización por materia", async () => {
    academico.obtenerSolicitudesEdicionPreceptor
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({ success: true, data: [{ id_asignacion: 12, estado: "pendiente" }] });
    const wrapper = await montar("../src/components/preceptor/views/LibretaPreceptorView.vue");

    const iconosLegados = wrapper
      .findAll("i[class*='fa-']")
      .filter((nodo) => !nodo.element.closest(".help-popover-wrapper"));
    expect(iconosLegados).toHaveLength(0);
    expect(wrapper.findAll(".planilla-table tbody tr")).toHaveLength(2);
    expect(wrapper.find('.btn-history-icon [data-icon="history"]').exists()).toBe(true);
    expect(wrapper.find('.btn-request-edit [data-icon="key"]').exists()).toBe(true);
    await wrapper.find("#buscarAlumnoLibreta").setValue("zoe");
    expect(wrapper.findAll(".planilla-table tbody tr")).toHaveLength(1);
    expect(wrapper.text()).toContain("Gómez");

    await wrapper.find(".btn-request-edit").trigger("click");
    await flushPromises();
    expect(academico.solicitarEdicionPlanilla).toHaveBeenCalledWith(12);
    expect(wrapper.find(".btn-request-edit").text()).toContain("Solicitud enviada");
    expect(wrapper.find(".btn-request-edit").element.disabled).toBe(true);
  });

  it("habilita la edición solo con permiso vigente y guarda la nota", async () => {
    academico.obtenerSolicitudesEdicionPreceptor.mockResolvedValue({
      success: true,
      data: [{ id_asignacion: 12, estado: "aprobada", fecha_expiracion: new Date(Date.now() + 3_600_000).toISOString() }],
    });
    const wrapper = await montar("../src/components/preceptor/views/LibretaPreceptorView.vue");

    expect(wrapper.findAll(".grade-editor input")).toHaveLength(2);
    expect(wrapper.find('.btn-save-grade-preceptor [data-icon="save"]').exists()).toBe(true);
    const primeraNota = wrapper.find(".grade-editor input");
    await primeraNota.setValue("8.5");
    await wrapper.find(".btn-save-grade-preceptor").trigger("click");
    expect(academico.guardarNota).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("calificación entera");

    await primeraNota.setValue("8");
    await wrapper.find(".btn-save-grade-preceptor").trigger("click");
    await flushPromises();

    expect(academico.guardarNota).toHaveBeenCalledWith({
      id_alumno: 8,
      id_asignacion: 12,
      calificacion: 8,
    });
    expect(wrapper.text()).toContain("Edición temporal habilitada");
  });
});

describe("Libreta Digital del Profesor", () => {
  it("rechaza notas decimales antes de llamar al servicio", async () => {
    const wrapper = await montar("../src/components/profesores/views/LibretaDigitalView.vue");
    const inputs = wrapper.findAll(".grade-input");
    const botones = wrapper.findAll(".btn-save-grade");

    await inputs[1].setValue("8.5");
    await botones[1].trigger("click");

    expect(academico.guardarNota).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("número entero");
    expect(inputs[1].attributes("step")).toBe("1");
  });

  it("muestra y resuelve solicitudes de los preceptores", async () => {
    const pendiente = {
      id_solicitud: 4,
      estado: "pendiente",
      fecha_solicitud: "2026-10-24T12:00:00.000Z",
      asignacion: {
        cursoAsignacion: curso,
        materiaAsignacion: { nombre_materia: "Matemática" },
      },
      preceptor: { nombre: "Mario", apellido: "Ruiz" },
    };
    academico.obtenerAccesosEdicionProfesor
      .mockResolvedValueOnce({ success: true, data: [pendiente] })
      .mockResolvedValueOnce({ success: true, data: [] });
    const wrapper = await montar("../src/components/profesores/views/LibretaDigitalView.vue");

    expect(wrapper.text()).toContain("Mario Ruiz");
    expect(wrapper.text()).toContain("Matemática · 2º A");
    await wrapper.find(".btn-solicitud-aprobar").trigger("click");
    await flushPromises();

    expect(academico.decidirSolicitudEdicion).toHaveBeenCalledWith(4, "aprobar");
    expect(wrapper.text()).toContain("No hay solicitudes pendientes");
    expect(wrapper.text()).toContain("Acceso habilitado por 24 horas.");
  });

  it("permite revocar un permiso temporal vigente", async () => {
    const permisoActivo = {
      id_solicitud: 18,
      estado: "aprobada",
      fecha_expiracion: new Date(Date.now() + 60_000).toISOString(),
      asignacion: {
        cursoAsignacion: curso,
        materiaAsignacion: { nombre_materia: "Matemática" },
      },
      preceptor: { nombre: "Mario", apellido: "Ruiz" },
    };
    academico.obtenerAccesosEdicionProfesor
      .mockResolvedValueOnce({ success: true, data: [permisoActivo] })
      .mockResolvedValueOnce({ success: true, data: [] });
    const wrapper = await montar("../src/components/profesores/views/LibretaDigitalView.vue");

    expect(wrapper.text()).toContain("1 permiso activo");
    expect(wrapper.find(".btn-solicitud-revocar").exists()).toBe(true);
    await wrapper.find(".btn-solicitud-revocar").trigger("click");
    await flushPromises();

    expect(academico.decidirSolicitudEdicion).toHaveBeenCalledWith(18, "revocar");
    expect(wrapper.text()).toContain("Acceso revocado.");
    expect(wrapper.find(".btn-solicitud-revocar").exists()).toBe(false);
  });

  it("busca alumnos por nombre o apellido en la planilla docente", async () => {
    const wrapper = await montar("../src/components/profesores/views/LibretaDigitalView.vue");
    expect(wrapper.find('.btn-history [data-icon="history"]').exists()).toBe(true);
    await wrapper.find("#buscarAlumnoProfesor").setValue("zoe");

    expect(wrapper.findAll(".notas-table tbody tr")).toHaveLength(1);
    expect(wrapper.text()).toContain("Gómez");
    expect(wrapper.text()).not.toContain("Ana, Pérez");
  });
});

describe("Libreta Digital del Administrador", () => {
  it("rechaza notas decimales en el formulario de edición", async () => {
    const wrapper = await montar("../src/components/administrador/views/LibretaAdminView.vue");
    await wrapper.find('select[aria-label="Seleccionar curso"]').setValue("4");
    await flushPromises();
    await wrapper.find(".icon-btn.edit").trigger("click");
    const notaInput = document.body.querySelector(".modal-input[type=number]");
    notaInput.value = "8.5";
    notaInput.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();
    expect(notaInput.value).toBe("8.5");
    document.body.querySelector("button.tb-btn.primary").click();
    await flushPromises();

    expect(academico.guardarNota).not.toHaveBeenCalled();
    expect(academico.modificarNotaService).not.toHaveBeenCalled();
    expect(notaInput.getAttribute("step")).toBe("1");
  });
});
