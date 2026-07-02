import { Router } from "express";
// BUG FIX: Se agregaron las importaciones faltantes de 'crearUsuario' y 'modificarUsuario'
import {
  generarToken,
  login,
  crearUsuario,
  sincronizarUsuarioAlumno,
  modificarUsuario,
  buscarEnPadron,
  iniciarRegistro,
} from "../controllers/auth-controller.js";
import ErrorHandler from "../ErrorHandler.js";

import {
  verificarCodigoVerificacion,
  invalidarCodigoVerificacion,
} from "../controllers/codigoDeVerificacion-controller.js";

const authRouter = Router();

//// ============== LOGIN ==============
authRouter.post("/login", async (req, res) => {
    
  // Espera recibir: {"email":"email@gmail.com","contrasena":"ejemplo_contrasena"}
  const { email, contrasena } = req.body;

  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m LOGIN POST");
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m USUARIO:", req.body);
    

    const response = await login(req.body);

    return res.status(200).json(response);
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR->", error.name);

    // BUG FIX: Si error.status es undefined (error nativo), responde con un código 400 o 500 para evitar que se caiga Express
    const statusCode = error.status || 400;
    const message =
      error.message || "Ocurrió un error al intentar iniciar sesión.";

    return res.status(statusCode).json({ ok: false, error: message });
  }
});

//// ============== REGISTRO ==============
/*
authRouter.post("/registro", async (req, res) => {
    
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m POST REGISTRO");
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m USUARIO REGISTRANDO:", req.body);
    

    // Ahora funciona correctamente gracias a la importación superior
    const usuario = await crearUsuario(req.body);

    const token = generarToken(usuario);

    return res.status(200).json({
      mensaje: "Registro exitoso",
      token: token,
      usuario: usuario,
    });
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR REGISTRO", error);

    // BUG FIX: Validación segura del código de estado del error
    const statusCode = error.status || 400;
    const message =
      error.message || "Ocurrió un error al procesar el registro.";

    return res.status(statusCode).json({ ok: false, error: message });
  }
});
*/

authRouter.post("/iniciar-registro", async (req, res) => {
    
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m POST REGISTRO");
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m USUARIO REGISTRANDO:", req.body);
    

    const resultado = await iniciarRegistro(req.body);

    return res.status(200).json({
      mensaje: "Se envió el código de verificación al correo electrónico.",
      ...resultado,
    });
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR REGISTRO", error);

    // BUG FIX: Validación segura del código de estado del error
    const statusCode = error.status || 400;
    const message =
      error.message || "Ocurrió un error al procesar el inicio de registro.";

    return res.status(statusCode).json({ ok: false, error: message });
  }
});

//// ============== MODIFICAR USUARIO ==============
authRouter.patch("/auth/", async (req, res) => {
    
  try {
    // Ahora funciona correctamente gracias a la importación superior
    const usuario = await modificarUsuario(req.body);

    return res.status(200).json(usuario);
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR AL MODIFICAR", error);

    // BUG FIX: Validación segura del código de estado del error
    const statusCode = error.status || 400;
    const message = error.message || "No se pudo modificar el usuario.";

    return res.status(statusCode).json({ ok: false, error: message });
  }
});

//// ============== BUSCAR EN PADRON ==============
authRouter.post("/buscar-en-padron", async (req, res) => {
    
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m POST BUSCAR-EN-PADRON");
    console.log(req.body);
    

    const verificado = await buscarEnPadron(req.body);

    if (!verificado) {
      throw new ErrorHandler(404, "No se te encontró en el padrón");
    }

    return res.status(200).json({
      valido: true,
      alumno: verificado.alumno,
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
  console.log(req.body);
  
  try {
    const { nombre, apellido, email, codigo, contrasena, id_rol } = req.body;

    const infoCodigo = {
      email,
      codigo,
    };

    const infoUsuario = {
      nombre,
      apellido,
      email,
      contrasena,
      id_rol,
    };

    const verificado = await verificarCodigoVerificacion(infoCodigo);

    const usuario = await crearUsuario(infoUsuario);

    await sincronizarUsuarioAlumno(verificado.id_alumno, usuario.id_usuario);

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
