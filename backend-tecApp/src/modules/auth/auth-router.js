import { Router } from "express";
// BUG FIX: Se agregaron las importaciones faltantes de 'crearUsuario' y 'modificarUsuario'
import {
  generarToken,
  login,
  crearUsuario,
  sincronizarUsuarioAlumno,
  sincronizarUsuarioProfesor,
  buscarEnPadron,
  iniciarRegistro,
} from "./auth-controller.js";
import ErrorHandler from "../../utils/ErrorHandler.js";
import { derivarRolDesdePadron } from "../../utils/rolPadron.js";

import {
  verificarCodigoVerificacion,
  invalidarCodigoVerificacion,
} from "./codigoDeVerificacion-controller.js";

const authRouter = Router();

//// ============== LOGIN ==============
authRouter.post("/login", async (req, res) => {
  // Espera recibir: {"email":"email@gmail.com","contrasena":"ejemplo_contrasena"}
  const { email, contrasena } = req.body;

  try {
    // SEGURIDAD: nunca loguear el body del login (contiene la contraseña).
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m LOGIN POST");

    const response = await login(req.body);

    return res.status(200).json(response);
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR->", error.name);

    // BUG FIX: Si error.status es undefined (error nativo), responde con un código 400 o 500 para evitar que se caiga Express
    const statusCode = error.status || 400;
    const message = error.message || "Ocurrió un error al intentar iniciar sesión.";

    return res.status(statusCode).json({ ok: false, error: message });
  }
});

authRouter.post("/iniciar-registro", async (req, res) => {
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m POST REGISTRO");

    const resultado = await iniciarRegistro(req.body);

    return res.status(200).json({
      mensaje: "Se envió el código de verificación al correo electrónico.",
      ...resultado,
    });
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR REGISTRO", error);

    // BUG FIX: Validación segura del código de estado del error
    const statusCode = error.status || 400;
    const message = error.message || "Ocurrió un error al procesar el inicio de registro.";

    return res.status(statusCode).json({ ok: false, error: message });
  }
});

// SEGURIDAD (CRIT-1): la ruta pública PATCH /api/auth/auth/ fue ELIMINADA.
// Permitía modificar email/contraseña/rol de cualquier usuario sin
// autenticación. La edición de usuarios vive en:
//   PATCH /api/usuarios/usuarios  (requiere autenticación + permiso
//   administrativo_editar_usuario), o en el perfil propio del usuario.

//// ============== BUSCAR EN PADRON ==============
authRouter.post("/buscar-en-padron", async (req, res) => {
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m POST BUSCAR-EN-PADRON");

    const verificado = await buscarEnPadron(req.body);

    if (!verificado) {
      throw new ErrorHandler(404, "No se te encontró en el padrón");
    }

    return res.status(200).json({
      valido: true,
      info: verificado.info,
    });
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR BUSCAR-EN-PADRON", error);

    // BUG FIX: Validación segura del código de estado del error
    const statusCode = error.status || 400;
    const message = error.message || "Ocurrió un error al buscarEnPadron.";

    return res.status(statusCode).json({
      ok: false,
      error: message,
    });
  }
});

//// ============== CODIGO DE VERIFICACION ==============
authRouter.post("/verificar-codigo", async (req, res) => {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m POST VERIFICAR-CODIGO");

  try {
    const { nombre, apellido, email, codigo, contrasena } = req.body;

    const infoCodigo = {
      email,
      codigo,
    };

    const verificado = await verificarCodigoVerificacion(infoCodigo);

    // SEGURIDAD (CRIT-2): el rol se deriva SIEMPRE del padrón validado por el
    // código de verificación. Nunca se acepta `id_rol` enviado por el cliente
    // (antes permitía crear una cuenta con rol root).
    const assigned_id_rol = derivarRolDesdePadron(verificado.rol_asociado);

    if (!assigned_id_rol) {
      throw new ErrorHandler(
        400,
        "No se pudo determinar el rol de la cuenta a crear.",
      );
    }

    const infoUsuario = {
      nombre,
      apellido,
      email,
      contrasena,
      id_rol: assigned_id_rol,
    };

    const usuario = await crearUsuario(infoUsuario);

    // Vincular la cuenta nueva con su entidad del padrón según el rol.
    // El administrativo no vive en las tablas de alumno/profesor, así que no
    // requiere sincronización.
    if (verificado.rol_asociado === "profesor") {
      await sincronizarUsuarioProfesor(verificado.id_entidad, usuario.id_usuario);
    } else if (verificado.rol_asociado === "alumno") {
      await sincronizarUsuarioAlumno(verificado.id_entidad, usuario.id_usuario);
    }

    await invalidarCodigoVerificacion(infoCodigo);

    const token = generarToken(usuario);

    return res.status(200).json({
      mensaje: "Registro exitoso",
      usuario,
      token,
    });
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m VERIFICAR CODIGO:", error);

    return res.status(error.status || 500).json({
      ok: false,
      error: error.message || "Ocurrió un error al procesar el registro.",
    });
  }
});

export default authRouter;
