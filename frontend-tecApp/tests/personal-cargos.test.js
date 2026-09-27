import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import PersonalView from "../src/components/administrador/views/PersonalView.vue";
import * as academicoService from "../src/services/academico-service.js";

vi.mock("../src/services/academico-service.js", async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    obtenerTodoPersonal: vi.fn(),
    obtenerCargos: vi.fn(),
    crearPersonal: vi.fn(),
  };
});

vi.mock("../src/services/usuarios-services.js", () => ({
  obtenerRoles: vi.fn().mockResolvedValue([]),
}));

const CARGOS = [
  { id_cargo: 1, nombre_cargo: "Preceptor" },
  { id_cargo: 2, nombre_cargo: "Administrativo" },
];

function montarEnCrear() {
  const wrapper = mount(PersonalView, {
    global: {
      stubs: {
        Pagination: true,
        UserAccessPanel: true,
        TelefonoInput: true,
      },
    },
  });
  // <script setup> no expone cambiarVista: se navega por el botón "Nuevo".
  wrapper.find("button.tb-btn.primary.sm").trigger("click");
  return wrapper;
}

describe("PersonalView cargos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    academicoService.obtenerTodoPersonal.mockResolvedValue({ data: [] });
    academicoService.obtenerCargos.mockResolvedValue({ data: CARGOS });
  });

  it("el select renderiza las opciones de la API", async () => {
    const wrapper = montarEnCrear();
    await flushPromises();
    const opciones = wrapper.findAll("select option");
    const textos = opciones.map((o) => o.text());
    expect(textos).toContain("Preceptor");
    expect(textos).toContain("Administrativo");
  });

  it("el payload de alta incluye el id_cargo elegido", async () => {
    academicoService.crearPersonal.mockResolvedValue({
      success: true,
      data: { id_personal: 1 },
    });
    const wrapper = montarEnCrear();
    await flushPromises();
    // <script setup>: el form vive dentro del setup y no es accesible desde
    // wrapper.vm. Se maneja el DOM: se elige el cargo y se completa el form.
    const selects = wrapper.findAll("select");
    const selectCargo = selects.at(-1);
    expect(selectCargo.exists()).toBe(true);
    await selectCargo.setValue(2);
    const porEtiqueta = (texto) =>
      wrapper
        .findAll(".form-group")
        .find((g) => g.find("label").text().includes(texto))
        ?.find("input");
    await porEtiqueta("Nombre").setValue("Ana");
    await porEtiqueta("Apellido").setValue("Paz");
    await porEtiqueta("DNI").setValue("30123456");
    await porEtiqueta("Email").setValue("ana@tecnica2.edu.ar");
    await porEtiqueta("Domicilio").setValue("Calle 1");
    const telefono = wrapper.findComponent({ name: "TelefonoInput" });
    if (telefono.exists()) {
      await telefono.find("input").setValue("2364 71-5375");
    }
    await porEtiqueta("Fecha de Nacimiento").setValue("1990-01-01");
    await porEtiqueta("Fecha de Ingreso").setValue("2020-01-01");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();
    expect(academicoService.crearPersonal).toHaveBeenCalled();
    expect(academicoService.crearPersonal.mock.calls[0][0].id_cargo).toBe(2);
  });
});
