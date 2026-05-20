import { Router } from "express";
const usuariosRouter = Router();
import {
  buscarUsuarioPorEmail,
  obtenerTodosUsuarios,
  obtenerUsuario,
  crearUsuario,
  eliminarUsuario,
  modificarUsuario,
  comprobarContrasenaUsuario,
} from "../controllers/usuarios-controller.js";

//// ============== OBTENER TODOS LOS USUARIOS ==============
usuariosRouter.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await obtenerTodosUsuarios();
    return res.status(200).json(usuarios);
  } catch (error) {
    console.log(`=== ERROR USUARIOS(GET) ${error} ===`);
    // BUG FIX: Evita caídas si error.status es undefined
    const statusCode = error.status || 500;
    return res
      .status(statusCode)
      .json({ error: error.message || "Error interno del servidor" });
  }
});

//// ============== BUSCAR USUARIO POR EMAIL ==============
usuariosRouter.get("/usuarios/buscar", async (req, res) => {
  const { email } = req.query;
  try {
    const usuario = await buscarUsuarioPorEmail(email);
    return res.status(200).json(usuario);
  } catch (error) {
    const statusCode = error.status || 500;
    return res
      .status(statusCode)
      .json({ error: error.message || "Error al buscar usuario" });
  }
});

//// ============== OBTENER USUARIO POR ID ==============
usuariosRouter.get("/usuarios/:id", async (req, res) => {
  try {
    const usuario = await obtenerUsuario(req.params.id);
    return res.status(200).json(usuario);
  } catch (error) {
    const statusCode = error.status || 500;
    return res
      .status(statusCode)
      .json({ error: error.message || "Error al obtener usuario" });
  }
});

//// ============== COMPROBAR CONTRASEÑA / LOGIN INTERNO ==============
usuariosRouter.post("/usuarios/login", async (req, res) => {
  const { email, contrasena } = req.body;

  // BUG FIX: Console log corregido para mostrar el contenido real del objeto body en vez de [object Object]
  console.log("=== COMPROBANDO CREDENCIALES INTERNAS ===");
  console.log("- EMAIL:", email);
  console.log("- BODY:", req.body);
  console.log("=========================================");

  try {
    const usuario = await comprobarContrasenaUsuario(email, contrasena);
    return res.status(200).json(usuario);
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      error: error.message || "Error en la validación de credenciales",
    });
  }
});

//// ============== ELIMINAR USUARIO ==============
usuariosRouter.delete("/usuarios/:id", async (req, res) => {
  try {
    const usuario = await eliminarUsuario(req.params.id);
    return res.status(200).json({
      ok: true,
      mensaje: "Usuario eliminado con éxito",
      registrosAfectados: usuario,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res
      .status(statusCode)
      .json({ error: error.message || "Error al eliminar usuario" });
  }
});

//// ============== CREAR USUARIO (Mapeado desde Registro) ==============
usuariosRouter.post("/usuarios/", async (req, res) => {
  try {
    console.log("==== POST CREAR USUARIO (DB) ====");
    console.log("- DATOS RECIBIDOS:", req.body);
    console.log("=================================");

    // El controlador ya se encarga de hashear y limpiar el objeto (retornando sin contraseña)
    const usuarioCreado = await crearUsuario(req.body);

    // BUG FIX: Se eliminó 'generarToken(usuario)' ya que este microservicio NO maneja la firma de JWTs.
    // Retornamos directamente los datos limpios del usuario para que servicio-auth genere el token allá.
    return res.status(201).json(usuarioCreado);
  } catch (error) {
    console.log("=== ERROR AL CREAR USUARIO ->", error);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      error: error.message || "Error al procesar la creación del usuario",
    });
  }
});

//// ============== MODIFICAR USUARIO ==============
usuariosRouter.patch("/usuarios/", async (req, res) => {
  try {
    const usuarioModificado = await modificarUsuario(req.body);
    return res.status(200).json(usuarioModificado);
  } catch (error) {
    const statusCode = error.status || 500;
    return res
      .status(statusCode)
      .json({ error: error.message || "Error al modificar usuario" });
  }
});

export default usuariosRouter;
