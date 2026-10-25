import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

const boletines = vi.hoisted(() => ({
  obtenerPeriodosBoletin: vi.fn(),
  actualizarPeriodoBoletin: vi.fn(),
  obtenerCargaProfesorBoletin: vi.fn(),
  guardarCalificacionBoletin: vi.fn(),
  finalizarMateriaBoletin: vi.fn(),
  solicitarReaperturaBoletin: vi.fn(),
  etiquetaCalificacion: vi.fn((tipo, valor) => tipo === "numerica" ? String(valor) : tipo || "Pendiente"),
  obtenerPlanillaBoletin: vi.fn(),
  obtenerConsolidadoBoletin: vi.fn(),
  obtenerReaperturasBoletin: vi.fn(),
  crearPeriodoBoletin: vi.fn(),
  prepararCursoBoletin: vi.fn(),
  decidirReaperturaBoletin: vi.fn(),
}));

const academico = vi.hoisted(() => ({
  obtenerCursos: vi.fn(),
  obtenerCursosPreceptor: vi.fn(),
  obtenerPlanes: vi.fn(),
}));

vi.mock("../src/services/boletines-service.js", () => boletines);
vi.mock("../src/services/academico-service.js", () => academico);
vi.mock("../src/services/toast-service.js", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const periodo = {
  id_periodo: 3,
  ciclo_lectivo: 2026,
  cuatrimestre: 1,
  fecha_inicio: "2026-03-01",
  fecha_cierre: "2026-07-31",
  estado: "abierto",
  vigente: true,
};

const planillaDocente = (puedeEscribir, calificaciones = []) => ({
  success: true,
  data: {
    asignaciones: [{
      id_asignacion: 12,
      id_curso: 4,
      materiaAsignacion: { nombre_materia: "Matemática" },
      cursoAsignacion: { nombre_curso: "2º A" },
    }],
    alumnos: [{ id_alumno: 8, id_curso: 4, apellido: "Pérez", nombre: "Ana" }],
    calificaciones,
    finalizaciones: [],
    porAsignacion: { 12: { preparada: true, puedeEscribir, motivoBloqueo: "La recepción está cerrada." } },
  },
});

const montar = async (ruta) => {
  const componente = (await import(ruta)).default;
  const wrapper = mount(componente);
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.clearAllMocks();
  boletines.obtenerPeriodosBoletin.mockResolvedValue({ success: true, data: [periodo] });
  boletines.obtenerCargaProfesorBoletin.mockResolvedValue(planillaDocente(false));
  boletines.guardarCalificacionBoletin.mockResolvedValue({ success: true, data: {} });
  boletines.obtenerReaperturasBoletin.mockResolvedValue({ success: true, data: [] });
  academico.obtenerCursos.mockResolvedValue({ success: true, data: [{ id_curso: 4, nombre_curso: "2º A" }] });
  academico.obtenerCursosPreceptor.mockResolvedValue({ success: true, data: [{ id_curso: 4, nombre_curso: "2º A" }] });
  academico.obtenerPlanes.mockResolvedValue({ success: true, data: [] });
});

describe("flujo de recepción de boletines", () => {
  it("administra la habilitación desde el estado de recepción del período", async () => {
    boletines.actualizarPeriodoBoletin.mockResolvedValue({ success: true });
    const wrapper = await montar("../src/components/administrador/views/BoletinesAdminView.vue");

    const control = wrapper.find('select[aria-label="Estado del período 2026, cuatrimestre 1"]');
    expect(wrapper.text()).toContain("Recepción de planillas");
    expect(control.exists()).toBe(true);
    await control.setValue("cerrado");
    await flushPromises();
    expect(boletines.actualizarPeriodoBoletin).toHaveBeenCalledWith(3, { estado: "cerrado" });
    wrapper.unmount();
  });

  it("mantiene la planilla del docente bloqueada mientras administración no habilita la recepción", async () => {
    const wrapper = await montar("../src/components/profesores/views/BoletinProfesorView.vue");

    expect(wrapper.text()).toContain("La recepción está cerrada.");
    expect(wrapper.find("input[type=number]").element.disabled).toBe(true);
    expect(wrapper.find("button.btn-finalizar").element.disabled).toBe(true);
    wrapper.unmount();
  });

  it("solo envía valores enteros en la calificación numérica", async () => {
    boletines.obtenerCargaProfesorBoletin.mockResolvedValue(planillaDocente(true));
    const wrapper = await montar("../src/components/profesores/views/BoletinProfesorView.vue");
    const input = wrapper.find('input[type="number"]');

    expect(input.attributes("step")).toBe("1");
    await input.setValue("8.5");
    await wrapper.find("button.btn-guardar").trigger("click");
    expect(boletines.guardarCalificacionBoletin).not.toHaveBeenCalled();

    await input.setValue("8");
    await wrapper.find("button.btn-guardar").trigger("click");
    await flushPromises();
    expect(boletines.guardarCalificacionBoletin).toHaveBeenCalledWith({
      id_periodo: 3,
      id_asignacion: 12,
      id_alumno: 8,
      tipo: "numerica",
      valor: 8,
      motivo: null,
    });
  });

  it("permite enviar una planilla completa y la registra como finalizada", async () => {
    boletines.obtenerCargaProfesorBoletin.mockResolvedValue(
      planillaDocente(true, [{ id_asignacion: 12, id_alumno: 8, tipo: "numerica", valor: 8 }]),
    );
    boletines.finalizarMateriaBoletin.mockResolvedValue({ success: true });
    const wrapper = await montar("../src/components/profesores/views/BoletinProfesorView.vue");

    const enviar = wrapper.find("button.btn-finalizar");
    expect(enviar.text()).toContain("Enviar planilla al preceptor");
    expect(enviar.element.disabled).toBe(false);
    await enviar.trigger("click");
    await flushPromises();
    expect(boletines.finalizarMateriaBoletin).toHaveBeenCalledWith(3, 12);
    wrapper.unmount();
  });

  it("expone al preceptor solo las materias enviadas en modo de solo lectura", async () => {
    boletines.obtenerPlanillaBoletin.mockResolvedValue({
      success: true,
      data: {
        curso: { nombre_curso: "2º A" },
        alumnos: [{ id_alumno: 8, apellido: "Pérez", nombre: "Ana" }],
        materias: [
          {
            asignacion: { id_asignacion: 12, materiaAsignacion: { nombre_materia: "Matemática" } },
            finalizada: true,
            calificaciones: [{ id_alumno: 8, tipo: "numerica", valor: 8 }],
          },
          {
            asignacion: { id_asignacion: 13, materiaAsignacion: { nombre_materia: "Historia" } },
            finalizada: false,
            calificaciones: [],
          },
        ],
      },
    });
    boletines.obtenerConsolidadoBoletin.mockResolvedValue({ success: false, status: 409, message: "Pendiente" });
    const wrapper = await montar("../src/components/preceptor/views/BoletinesPreceptorView.vue");

    expect(wrapper.text()).toContain("Matemática");
    expect(wrapper.findAll(".materia-bloque")).toHaveLength(1);
    expect(wrapper.find(".materia-bloque").text()).not.toContain("Historia");
    expect(wrapper.text()).toContain("Solo lectura");
    expect(boletines.obtenerPlanillaBoletin).toHaveBeenCalledWith("4", "3");
    wrapper.unmount();
  });
});
