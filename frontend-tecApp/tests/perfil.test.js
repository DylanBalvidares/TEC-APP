import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import UsuarioPerfil from "../src/components/administrador/views/UsuarioPerfil.vue";
import { useAuthStore } from "../src/stores/auth.js";
import { usarToasts } from "../src/services/toast-service.js";

const flush = () => new Promise((r) => setTimeout(r, 0));

// Mocks de servicios
const modificarUsuarioMock = vi.fn();
const verificarContrasenaMock = vi.fn();

vi.mock("../src/services/usuarios-services.js", () => ({
  modificarUsuario: (...args) => modificarUsuarioMock(...args),
  verificarContrasena: (...args) => verificarContrasenaMock(...args),
}));

const USUARIO = {
  id_usuario: 42,
  nombre: "Ana",
  apellido: "Gómez",
  email: "ana@tecnica2.edu.ar",
  nombre_rol: "root",
};

const montar = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const auth = useAuthStore();
  auth.login("token-de-test", { ...USUARIO });

  const wrapper = mount(UsuarioPerfil, { global: { plugins: [pinia] } });
  await flush();
  return { wrapper, auth };
};

const limpiarToasts = () => {
  const { toasts } = usarToasts();
  toasts.splice(0, toasts.length);
};

beforeEach(() => {
  modificarUsuarioMock.mockReset();
  verificarContrasenaMock.mockReset();
  limpiarToasts();
  localStorage.clear();
});

describe("UsuarioPerfil — visualización", () => {
  it("muestra nombre completo, email y rol legible", async () => {
    const { wrapper } = await montar();
    expect(wrapper.text()).toContain("Ana Gómez");
    expect(wrapper.text()).toContain("ana@tecnica2.edu.ar");
    // root se muestra como "Administrador", no como "root"
    expect(wrapper.text()).toContain("Administrador");
    expect(wrapper.text()).not.toContain("root");
    wrapper.unmount();
  });

  it("no permite guardar si no hay cambios", async () => {
    const { wrapper } = await montar();
    const botonGuardar = wrapper.find('button[type="submit"]');
    expect(botonGuardar.attributes("disabled")).toBeDefined();
    expect(modificarUsuarioMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

describe("UsuarioPerfil — datos personales", () => {
  it("guarda los datos y actualiza la sesión del store", async () => {
    modificarUsuarioMock.mockResolvedValueOnce({ success: true });
    const { wrapper, auth } = await montar();

    await wrapper.find("#perfil-nombre").setValue("Analía");
    await wrapper.find('form').trigger("submit");
    await flush();

    expect(modificarUsuarioMock).toHaveBeenCalledOnce();
    expect(modificarUsuarioMock.mock.calls[0][0]).toMatchObject({
      id_usuario: 42,
      nombre: "Analía",
      apellido: "Gómez",
      email: "ana@tecnica2.edu.ar",
    });
    // El store y localStorage reflejan el cambio (Topbar incluido)
    expect(auth.usuario.nombre).toBe("Analía");
    expect(JSON.parse(localStorage.getItem("usuario")).nombre).toBe("Analía");
    wrapper.unmount();
  });

  it("no guarda si el email es inválido y muestra el error", async () => {
    const { wrapper } = await montar();
    await wrapper.find("#perfil-email").setValue("correo-invalido");
    await wrapper.find("#perfil-email").trigger("blur");

    expect(wrapper.find(".field-error").exists()).toBe(true);
    expect(modificarUsuarioMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("muestra toast de error si la API falla", async () => {
    modificarUsuarioMock.mockRejectedValueOnce({
      response: { data: { mensaje: "El email ya está en uso por otro usuario" } },
    });
    const { wrapper } = await montar();

    await wrapper.find("#perfil-email").setValue("otro@tecnica2.edu.ar");
    await wrapper.find("form").trigger("submit");
    await flush();

    const { toasts } = usarToasts();
    expect(toasts.some((t) => t.tipo === "error")).toBe(true);
    expect(toasts.find((t) => t.tipo === "error").mensaje).toContain("ya está en uso");
    wrapper.unmount();
  });
});

describe("UsuarioPerfil — cambio de contraseña", () => {
  const completarPasswords = async (wrapper, { actual, nueva, confirmar }) => {
    await wrapper.find("#perfil-pass-actual").setValue(actual);
    await wrapper.find("#perfil-pass-nueva").setValue(nueva);
    await wrapper.find("#perfil-pass-confirmar").setValue(confirmar);
  };

  it("rechaza el envío si las contraseñas nuevas no coinciden", async () => {
    const { wrapper } = await montar();
    await completarPasswords(wrapper, {
      actual: "vieja123",
      nueva: "nueva123",
      confirmar: "distinta123",
    });
    await wrapper.findAll("form")[1].trigger("submit");
    await flush();

    expect(verificarContrasenaMock).not.toHaveBeenCalled();
    expect(modificarUsuarioMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("rechaza contraseña nueva igual a la actual", async () => {
    const { wrapper } = await montar();
    await completarPasswords(wrapper, {
      actual: "misma123",
      nueva: "misma123",
      confirmar: "misma123",
    });
    await wrapper.findAll("form")[1].trigger("submit");
    await flush();

    expect(wrapper.text()).toContain("distinta a la actual");
    expect(modificarUsuarioMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("no cambia la contraseña si la actual es incorrecta", async () => {
    verificarContrasenaMock.mockResolvedValueOnce({
      success: false,
      status: 401,
      message: "La contraseña es incorrecta",
    });
    const { wrapper } = await montar();
    await completarPasswords(wrapper, {
      actual: "incorrecta",
      nueva: "nueva123",
      confirmar: "nueva123",
    });
    await wrapper.findAll("form")[1].trigger("submit");
    await flush();

    expect(verificarContrasenaMock).toHaveBeenCalledOnce();
    expect(modificarUsuarioMock).not.toHaveBeenCalled();
    const { toasts } = usarToasts();
    expect(toasts.some((t) => t.tipo === "error")).toBe(true);
    wrapper.unmount();
  });

  it("cambia la contraseña cuando la actual es válida y limpia el formulario", async () => {
    verificarContrasenaMock.mockResolvedValueOnce({ success: true, data: {} });
    modificarUsuarioMock.mockResolvedValueOnce({ success: true });
    const { wrapper } = await montar();

    await completarPasswords(wrapper, {
      actual: "vieja123",
      nueva: "nueva123",
      confirmar: "nueva123",
    });
    await wrapper.findAll("form")[1].trigger("submit");
    await flush();

    expect(verificarContrasenaMock).toHaveBeenCalledWith(
      "ana@tecnica2.edu.ar",
      "vieja123",
    );
    expect(modificarUsuarioMock).toHaveBeenCalledOnce();
    expect(modificarUsuarioMock.mock.calls[0][0]).toEqual({
      id_usuario: 42,
      contrasena: "nueva123",
    });
    // La verificación de la contraseña actual ocurre antes de aplicar el cambio
    expect(verificarContrasenaMock.mock.invocationCallOrder[0]).toBeLessThan(
      modificarUsuarioMock.mock.invocationCallOrder[0],
    );

    // El formulario se limpia y se avisa por toast
    expect(wrapper.find("#perfil-pass-nueva").element.value).toBe("");
    expect(wrapper.find("#perfil-pass-actual").element.value).toBe("");
    const { toasts } = usarToasts();
    expect(toasts.some((t) => t.tipo === "success")).toBe(true);
    wrapper.unmount();
  });
});
