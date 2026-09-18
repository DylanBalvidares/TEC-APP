import { Router } from "express";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import { Usuario, Rol } from "../../db/models/index.js";
import {
  buscarUsuarioPorEmail,
  obtenerTodosUsuarios,
  obtenerUsuario,
  crearUsuario,
  eliminarUsuario,
  modificarUsuario,
  comprobarContrasenaUsuario,
} from "./usuarios-controller.js";

const usuariosRouter = Router();

const ROL_ROOT_ID = 8;

function esActorRoot(req) {
  return Number(req.headers["id_rol"]) === ROL_ROOT_ID;
}

async function esUsuarioRoot(idUsuario) {
  const usuario = await Usuario.findByPk(idUsuario, {
    include: [{ model: Rol, as: "rol", attributes: ["nombre_rol"] }],
  });
  return (
    usuario?.rol?.nombre_rol === "root" ||
    Number(usuario?.id_rol) === ROL_ROOT_ID
  );
}

// Permisos para READ de usuarios: cualquiera de los que gestionan usuarios
const PERMISO_VER_USUARIOS = [
  "administrativo_crear_usuario",
  "administrativo_editar_usuario",
  "administrativo_eliminar_usuario",
];

//// ============== OBTENER TODOS LOS USUARIOS ==============
usuariosRouter.get(
  "/usuarios",
  comprobarPermiso(PERMISO_VER_USUARIOS),
  async (req, res) => {
    try {
      const usuarios = await obtenerTodosUsuarios();
      return res.status(200).json(usuarios);
    } catch (error) {
      const statusCode = error.statusCode || error.status || 500;
      return res
        .status(statusCode)
        .json({ error: error.message || "Error interno del servidor" });
    }
  },
);

//// ============== BUSCAR USUARIO POR EMAIL ==============
usuariosRouter.get(
  "/usuarios/buscar",
  comprobarPermiso(PERMISO_VER_USUARIOS),
  async (req, res) => {
    const { email } = req.query;
    try {
      const usuario = await buscarUsuarioPorEmail(email);
      return res.status(200).json(usuario);
    } catch (error) {
      const statusCode = error.statusCode || error.status || 500;
      return res
        .status(statusCode)
        .json({ error: error.message || "Error al buscar usuario" });
    }
  },
);

//// ============== OBTENER USUARIO POR ID ==============
usuariosRouter.get(
  "/usuarios/:id",
  comprobarPermiso(PERMISO_VER_USUARIOS),
  async (req, res) => {
    try {
      const usuario = await obtenerUsuario(req.params.id);
      return res.status(200).json(usuario);
    } catch (error) {
      const statusCode = error.statusCode || error.status || 500;
      return res
        .status(statusCode)
        .json({ error: error.message || "Error al obtener usuario" });
    }
  },
);

//// ============== COMPROBAR CONTRASEÑA / LOGIN INTERNO ==============
usuariosRouter.post("/usuarios/login", async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const usuario = await comprobarContrasenaUsuario(email, contrasena);
    return res.status(200).json(usuario);
  } catch (error) {
    const statusCode = error.statusCode || error.status || 500;
    return res.status(statusCode).json({
      error: error.message || "Error en la validación de credenciales",
    });
  }
});

//// ============== ELIMINAR USUARIO ==============
usuariosRouter.delete(
  "/usuarios/:id",
  comprobarPermiso("administrativo_eliminar_usuario"),
  async (req, res) => {
    try {
      // Protección: solo root puede eliminar cuentas con rol root
      if (!esActorRoot(req) && (await esUsuarioRoot(req.params.id))) {
        return res.status(403).json({
          error: "Acceso denegado: solo root puede eliminar cuentas root",
        });
      }

      const usuario = await eliminarUsuario(req.params.id);
      return res.status(200).json({
        ok: true,
        mensaje: "Usuario eliminado con éxito",
        registrosAfectados: usuario,
      });
    } catch (error) {
      const statusCode = error.statusCode || error.status || 500;
      return res
        .status(statusCode)
        .json({ error: error.message || "Error al eliminar usuario" });
    }
  },
);

//// ============== CREAR USUARIO ==============
usuariosRouter.post(
  "/usuarios/registro",
  comprobarPermiso("administrativo_crear_usuario"),
  async (req, res) => {
    try {
      // Protección: solo root puede crear cuentas con rol root
      if (Number(req.body.id_rol) === ROL_ROOT_ID && !esActorRoot(req)) {
        return res.status(403).json({
          error: "Acceso denegado: solo root puede asignar el rol root",
        });
      }

      const usuarioCreado = await crearUsuario(req.body);
      return res.status(201).json(usuarioCreado);
    } catch (error) {
      const statusCode = error.statusCode || error.status || 500;
      return res.status(statusCode).json({
        error: error.message || "Error al procesar la creación del usuario",
      });
    }
  },
);

//// ============== MODIFICAR USUARIO ==============
usuariosRouter.patch(
  "/usuarios",
  comprobarPermiso("administrativo_editar_usuario"),
  async (req, res) => {
    try {
      // Protección: solo root puede asignar el rol root
      if (Number(req.body.id_rol) === ROL_ROOT_ID && !esActorRoot(req)) {
        return res.status(403).json({
          error: "Acceso denegado: solo root puede asignar el rol root",
        });
      }

      const usuarioModificado = await modificarUsuario(req.body);
      return res.status(200).json(usuarioModificado);
    } catch (error) {
      const statusCode = error.statusCode || error.status || 500;
      return res
        .status(statusCode)
        .json({ error: error.message || "Error al modificar usuario" });
    }
  },
);

export default usuariosRouter;