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
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m COMPROBANDO CREDENCIALES INTERNAS");
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m  EMAIL:", email);
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m  BODY:", req.body);
  

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

//// ============== CREAR USUARIO ==============
usuariosRouter.post("/usuarios/registro", async (req, res) => {
    
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m POST CREAR USUARIO (DB)");
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m  DATOS RECIBIDOS:", req.body);
    

    // El controlador ya se encarga de hashear y limpiar el objeto (retornando sin contraseña)
    const usuarioCreado = await crearUsuario(req.body);

    // BUG FIX: Se eliminó 'generarToken(usuario)' ya que este microservicio NO maneja la firma de JWTs.
    // Retornamos directamente los datos limpios del usuario para que servicio-auth genere el token allá.
    return res.status(201).json(usuarioCreado);
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR AL CREAR USUARIO", error);
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
